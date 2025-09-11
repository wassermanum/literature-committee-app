import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTransactionData {
  type: 'INCOMING' | 'OUTGOING' | 'ADJUSTMENT';
  fromOrganizationId?: string;
  toOrganizationId: string;
  literatureId: string;
  quantity: number;
  unitPrice?: number;
  orderId?: string;
  notes?: string;
}

export interface TransactionFilters {
  type?: string;
  fromOrganizationId?: string;
  toOrganizationId?: string;
  literatureId?: string;
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface InventoryAdjustmentData {
  organizationId: string;
  literatureId: string;
  quantityChange: number;
  reason: string;
  notes?: string;
}

export class TransactionService {
  async getAllTransactions(filters?: TransactionFilters) {
    const where: any = {};

    if (filters) {
      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.fromOrganizationId) {
        where.fromOrganizationId = filters.fromOrganizationId;
      }

      if (filters.toOrganizationId) {
        where.toOrganizationId = filters.toOrganizationId;
      }

      if (filters.literatureId) {
        where.literatureId = filters.literatureId;
      }

      if (filters.orderId) {
        where.orderId = filters.orderId;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo;
        }
      }
    }

    return await prisma.transaction.findMany({
      where,
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        literature: {
          select: {
            id: true,
            title: true,
            category: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTransactionById(id: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            contactPerson: true,
            email: true,
          },
        },
        toOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            contactPerson: true,
            email: true,
          },
        },
        literature: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async createTransaction(transactionData: CreateTransactionData) {
    // Валидация данных
    await this.validateTransactionData(transactionData);

    // Получаем цену литературы, если не указана
    let unitPrice = transactionData.unitPrice;
    if (!unitPrice) {
      const literature = await prisma.literature.findUnique({
        where: { id: transactionData.literatureId },
      });
      unitPrice = literature?.price || 0;
    }

    const totalAmount = unitPrice * Math.abs(transactionData.quantity);

    // Создаем транзакцию
    const transaction = await prisma.transaction.create({
      data: {
        type: transactionData.type,
        fromOrganizationId: transactionData.fromOrganizationId,
        toOrganizationId: transactionData.toOrganizationId,
        literatureId: transactionData.literatureId,
        quantity: transactionData.quantity,
        unitPrice,
        totalAmount,
        orderId: transactionData.orderId,
        notes: transactionData.notes,
      },
    });

    return await this.getTransactionById(transaction.id);
  }

  async createInventoryAdjustment(adjustmentData: InventoryAdjustmentData) {
    // Проверяем, что организация и литература существуют
    const organization = await prisma.organization.findUnique({
      where: { id: adjustmentData.organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const literature = await prisma.literature.findUnique({
      where: { id: adjustmentData.literatureId },
    });

    if (!literature || !literature.isActive) {
      throw new Error('Literature not found or inactive');
    }

    // Получаем текущие остатки
    const currentInventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId: adjustmentData.organizationId,
          literatureId: adjustmentData.literatureId,
        },
      },
    });

    const currentQuantity = currentInventory?.quantity || 0;
    const newQuantity = currentQuantity + adjustmentData.quantityChange;

    // Проверяем, что новое количество не отрицательное
    if (newQuantity < 0) {
      throw new Error(`Adjustment would result in negative inventory. Current: ${currentQuantity}, Change: ${adjustmentData.quantityChange}`);
    }

    // Выполняем корректировку в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем транзакцию корректировки
      const transaction = await tx.transaction.create({
        data: {
          type: 'ADJUSTMENT',
          toOrganizationId: adjustmentData.organizationId,
          literatureId: adjustmentData.literatureId,
          quantity: adjustmentData.quantityChange,
          unitPrice: literature.price,
          totalAmount: Math.abs(adjustmentData.quantityChange) * literature.price,
          notes: `${adjustmentData.reason}${adjustmentData.notes ? ': ' + adjustmentData.notes : ''}`,
        },
      });

      // Обновляем остатки на складе
      await tx.inventory.upsert({
        where: {
          organizationId_literatureId: {
            organizationId: adjustmentData.organizationId,
            literatureId: adjustmentData.literatureId,
          },
        },
        update: {
          quantity: newQuantity,
          lastUpdated: new Date(),
        },
        create: {
          organizationId: adjustmentData.organizationId,
          literatureId: adjustmentData.literatureId,
          quantity: Math.max(0, adjustmentData.quantityChange),
          reservedQuantity: 0,
        },
      });

      return transaction;
    });

    return await this.getTransactionById(result.id);
  }

  async getTransactionsByOrganization(organizationId: string, type: 'from' | 'to' | 'all' = 'all') {
    let where: any = {};

    switch (type) {
      case 'from':
        where = { fromOrganizationId: organizationId };
        break;
      case 'to':
        where = { toOrganizationId: organizationId };
        break;
      case 'all':
        where = {
          OR: [
            { fromOrganizationId: organizationId },
            { toOrganizationId: organizationId },
          ],
        };
        break;
    }

    return await prisma.transaction.findMany({
      where,
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        literature: {
          select: {
            id: true,
            title: true,
            category: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTransactionsByLiterature(literatureId: string) {
    return await prisma.transaction.findMany({
      where: { literatureId },
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        literature: {
          select: {
            id: true,
            title: true,
            category: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTransactionsByOrder(orderId: string) {
    return await prisma.transaction.findMany({
      where: { orderId },
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        literature: {
          select: {
            id: true,
            title: true,
            category: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTransactionStatistics(organizationId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {};

    if (organizationId) {
      where.OR = [
        { fromOrganizationId: organizationId },
        { toOrganizationId: organizationId },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Статистика по типам транзакций
    const byType = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _count: {
        type: true,
      },
      _sum: {
        totalAmount: true,
        quantity: true,
      },
    });

    // Общая статистика
    const totalTransactions = await prisma.transaction.count({ where });
    
    const totalAmounts = await prisma.transaction.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
    });

    // Статистика по литературе
    const byLiterature = await prisma.transaction.groupBy({
      by: ['literatureId'],
      where,
      _count: {
        literatureId: true,
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10, // Топ 10 по сумме
    });

    // Получаем информацию о литературе для топ-10
    const literatureIds = byLiterature.map(item => item.literatureId);
    const literatureInfo = await prisma.literature.findMany({
      where: {
        id: {
          in: literatureIds,
        },
      },
      select: {
        id: true,
        title: true,
        category: true,
      },
    });

    const topLiterature = byLiterature.map(item => ({
      literature: literatureInfo.find(lit => lit.id === item.literatureId),
      transactionCount: item._count.literatureId,
      totalQuantity: item._sum.quantity || 0,
      totalAmount: item._sum.totalAmount || 0,
    }));

    return {
      totalTransactions,
      totalAmount: totalAmounts._sum.totalAmount || 0,
      byType: byType.map(item => ({
        type: item.type,
        count: item._count.type,
        totalQuantity: item._sum.quantity || 0,
        totalAmount: item._sum.totalAmount || 0,
      })),
      topLiterature,
    };
  }

  async createOrderTransactions(orderId: string, type: 'OUTGOING' | 'INCOMING', items: Array<{
    literatureId: string;
    quantity: number;
    unitPrice: number;
  }>, fromOrganizationId: string, toOrganizationId: string, orderNumber: string) {
    const transactions = [];
    
    for (const item of items) {
      const transaction = await this.createTransaction({
        type,
        fromOrganizationId: type === 'OUTGOING' ? fromOrganizationId : undefined,
        toOrganizationId,
        literatureId: item.literatureId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        orderId,
        notes: type === 'OUTGOING' 
          ? `Order shipment: ${orderNumber}`
          : `Order delivery: ${orderNumber}`,
      });
      
      transactions.push(transaction);
    }
    
    return transactions;
  }

  async getMovementReport(organizationId?: string, literatureId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {};

    if (organizationId) {
      where.OR = [
        { fromOrganizationId: organizationId },
        { toOrganizationId: organizationId },
      ];
    }

    if (literatureId) {
      where.literatureId = literatureId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        toOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        literature: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Группируем по дням для анализа движения
    const movementByDay = transactions.reduce((acc: any, transaction) => {
      const date = transaction.createdAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          incoming: 0,
          outgoing: 0,
          adjustments: 0,
          totalAmount: 0,
          transactionCount: 0,
        };
      }

      acc[date].transactionCount++;
      acc[date].totalAmount += transaction.totalAmount;

      switch (transaction.type) {
        case 'INCOMING':
          acc[date].incoming += transaction.quantity;
          break;
        case 'OUTGOING':
          acc[date].outgoing += Math.abs(transaction.quantity);
          break;
        case 'ADJUSTMENT':
          acc[date].adjustments += transaction.quantity;
          break;
      }

      return acc;
    }, {});

    return {
      transactions,
      summary: Object.values(movementByDay).sort((a: any, b: any) => b.date.localeCompare(a.date)),
    };
  }

  async deleteTransaction(id: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Проверяем, можно ли удалить транзакцию
    // Обычно транзакции не удаляются, а создаются корректирующие
    if (transaction.orderId) {
      throw new Error('Cannot delete transaction linked to an order');
    }

    // Для корректировок можно создать обратную корректировку
    if (transaction.type === 'ADJUSTMENT') {
      // Создаем обратную корректировку
      await this.createTransaction({
        type: 'ADJUSTMENT',
        toOrganizationId: transaction.toOrganizationId,
        literatureId: transaction.literatureId,
        quantity: -transaction.quantity,
        unitPrice: transaction.unitPrice,
        notes: `Reversal of transaction ${transaction.id}${transaction.notes ? ': ' + transaction.notes : ''}`,
      });

      return { success: true, message: 'Reversal transaction created' };
    }

    throw new Error('Cannot delete this type of transaction');
  }

  // Приватные методы

  private async validateTransactionData(data: CreateTransactionData) {
    // Проверяем, что литература существует
    const literature = await prisma.literature.findUnique({
      where: { id: data.literatureId },
    });

    if (!literature || !literature.isActive) {
      throw new Error('Literature not found or inactive');
    }

    // Проверяем организации
    if (data.fromOrganizationId) {
      const fromOrg = await prisma.organization.findUnique({
        where: { id: data.fromOrganizationId },
      });

      if (!fromOrg) {
        throw new Error('From organization not found');
      }
    }

    const toOrg = await prisma.organization.findUnique({
      where: { id: data.toOrganizationId },
    });

    if (!toOrg) {
      throw new Error('To organization not found');
    }

    // Валидация по типу транзакции
    switch (data.type) {
      case 'INCOMING':
        // Для входящих транзакций fromOrganizationId может быть null (поступление от внешнего поставщика)
        break;
      case 'OUTGOING':
        if (!data.fromOrganizationId) {
          throw new Error('From organization is required for outgoing transactions');
        }
        // Проверяем достаточность остатков
        await this.validateSufficientInventory(data.fromOrganizationId, data.literatureId, Math.abs(data.quantity));
        break;
      case 'ADJUSTMENT':
        // Для корректировок fromOrganizationId не требуется
        break;
      default:
        throw new Error('Invalid transaction type');
    }

    // Проверяем, что количество не равно нулю
    if (data.quantity === 0) {
      throw new Error('Transaction quantity cannot be zero');
    }

    // Проверяем заказ, если указан
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }
    }
  }

  private async validateSufficientInventory(organizationId: string, literatureId: string, requiredQuantity: number) {
    const inventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
    });

    if (!inventory) {
      throw new Error('No inventory found for this literature in the organization');
    }

    const availableQuantity = inventory.quantity - inventory.reservedQuantity;
    if (availableQuantity < requiredQuantity) {
      throw new Error(`Insufficient inventory. Available: ${availableQuantity}, required: ${requiredQuantity}`);
    }
  }
}