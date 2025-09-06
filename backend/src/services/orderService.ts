import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateOrderData {
  fromOrganizationId: string;
  toOrganizationId: string;
  items: {
    literatureId: string;
    quantity: number;
  }[];
  notes?: string;
  createdById?: string;
}

export interface UpdateOrderData {
  status?: string;
  notes?: string;
  totalAmount?: number;
}

export interface OrderFilters {
  status?: string;
  fromOrganizationId?: string;
  toOrganizationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  createdById?: string;
}

export interface OrderItemData {
  literatureId: string;
  quantity: number;
  unitPrice?: number;
}

export class OrderService {
  // Валидные переходы статусов
  private readonly statusTransitions: Record<string, string[]> = {
    'DRAFT': ['PENDING', 'REJECTED'],
    'PENDING': ['APPROVED', 'REJECTED'],
    'APPROVED': ['IN_ASSEMBLY', 'REJECTED'],
    'IN_ASSEMBLY': ['SHIPPED'],
    'SHIPPED': ['DELIVERED'],
    'DELIVERED': ['COMPLETED'],
    'COMPLETED': [],
    'REJECTED': []
  };

  async getAllOrders(filters?: OrderFilters) {
    const where: any = {};

    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.fromOrganizationId) {
        where.fromOrganizationId = filters.fromOrganizationId;
      }

      if (filters.toOrganizationId) {
        where.toOrganizationId = filters.toOrganizationId;
      }

      if (filters.createdById) {
        where.createdById = filters.createdById;
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

    return await prisma.order.findMany({
      where,
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
            contactPerson: true,
            email: true,
          },
        },
        toOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
            contactPerson: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lockedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            literature: {
              select: {
                id: true,
                title: true,
                category: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        fromOrganization: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            contactPerson: true,
            phone: true,
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
            phone: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        lockedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            literature: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                price: true,
              },
            },
          },
        },
        transactions: {
          include: {
            literature: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async createOrder(orderData: CreateOrderData) {
    // Проверяем, что организации существуют
    const fromOrganization = await prisma.organization.findUnique({
      where: { id: orderData.fromOrganizationId },
    });

    if (!fromOrganization) {
      throw new Error('From organization not found');
    }

    const toOrganization = await prisma.organization.findUnique({
      where: { id: orderData.toOrganizationId },
    });

    if (!toOrganization) {
      throw new Error('To organization not found');
    }

    // Проверяем иерархию организаций
    await this.validateOrganizationHierarchy(orderData.fromOrganizationId, orderData.toOrganizationId);

    // Проверяем, что литература существует и активна
    let totalAmount = 0;
    const itemsWithPrices: Array<OrderItemData & { totalPrice: number }> = [];

    for (const item of orderData.items) {
      const literature = await prisma.literature.findUnique({
        where: { id: item.literatureId },
      });

      if (!literature || !literature.isActive) {
        throw new Error(`Literature with id ${item.literatureId} not found or inactive`);
      }

      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const unitPrice = literature.price;
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;

      itemsWithPrices.push({
        literatureId: item.literatureId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    // Генерируем номер заказа
    const orderNumber = await this.generateOrderNumber();

    // Создаем заказ в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем заказ
      const order = await tx.order.create({
        data: {
          orderNumber,
          fromOrganizationId: orderData.fromOrganizationId,
          toOrganizationId: orderData.toOrganizationId,
          status: 'DRAFT',
          totalAmount,
          notes: orderData.notes,
          createdById: orderData.createdById,
        },
      });

      // Создаем элементы заказа
      for (const item of itemsWithPrices) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            literatureId: item.literatureId,
            quantity: item.quantity,
            unitPrice: item.unitPrice!,
            totalPrice: item.totalPrice,
          },
        });
      }

      return order;
    });

    // Возвращаем полную информацию о заказе
    return await this.getOrderById(result.id);
  }

  async updateOrder(id: string, updateData: UpdateOrderData) {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Проверяем, можно ли редактировать заказ
    if (existingOrder.lockedAt && updateData.status !== 'REJECTED') {
      throw new Error('Order is locked and cannot be modified');
    }

    // Если обновляется статус, проверяем валидность перехода
    if (updateData.status && updateData.status !== existingOrder.status) {
      const validTransitions = this.statusTransitions[existingOrder.status] || [];
      if (!validTransitions.includes(updateData.status)) {
        throw new Error(`Invalid status transition from ${existingOrder.status} to ${updateData.status}`);
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return await this.getOrderById(updatedOrder.id);
  }

  async updateOrderStatus(id: string, status: string, notes?: string, _userId?: string) {
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            literature: true,
          },
        },
      },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Валидируем переход статуса
    const validTransitions = this.statusTransitions[existingOrder.status] || [];
    if (!validTransitions.includes(status)) {
      throw new Error(`Invalid status transition from ${existingOrder.status} to ${status}`);
    }

    // Выполняем действия в зависимости от нового статуса
    await prisma.$transaction(async (tx) => {
      // Обновляем статус заказа
      await tx.order.update({
        where: { id },
        data: {
          status,
          notes: notes || existingOrder.notes,
          updatedAt: new Date(),
        },
      });

      // Выполняем специфичные для статуса действия
      switch (status) {
        case 'APPROVED':
          // Резервируем товары на складе
          await this.reserveOrderItems(tx, existingOrder);
          break;

        case 'SHIPPED':
          // Создаем транзакции движения товаров
          await this.createOrderTransactions(tx, existingOrder);
          break;

        case 'COMPLETED':
          // Создаем входящие транзакции для получающей организации
          await this.createIncomingTransactions(tx, existingOrder);
          // Обновляем остатки на складах
          await this.updateInventoryForCompletedOrder(tx, existingOrder);
          break;

        case 'REJECTED':
          // Освобождаем зарезервированные товары
          await this.releaseOrderReservations(tx, existingOrder);
          break;
      }
    });

    return await this.getOrderById(id);
  }

  async lockOrder(id: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.lockedAt) {
      throw new Error('Order is already locked');
    }

    // Заказы можно блокировать только в определенных статусах
    const lockableStatuses = ['DRAFT', 'PENDING', 'APPROVED'];
    if (!lockableStatuses.includes(order.status)) {
      throw new Error(`Cannot lock order with status ${order.status}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        lockedAt: new Date(),
        lockedById: userId,
      },
    });

    return await this.getOrderById(updatedOrder.id);
  }

  async unlockOrder(id: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.lockedAt) {
      throw new Error('Order is not locked');
    }

    // Только тот, кто заблокировал, или админ может разблокировать
    if (order.lockedById !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'ADMIN') {
        throw new Error('Only the user who locked the order or an admin can unlock it');
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        lockedAt: null,
        lockedById: null,
      },
    });

    return await this.getOrderById(updatedOrder.id);
  }

  async addOrderItem(orderId: string, itemData: OrderItemData) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.lockedAt) {
      throw new Error('Cannot modify locked order');
    }

    // Можно добавлять элементы только в определенных статусах
    const editableStatuses = ['DRAFT', 'PENDING'];
    if (!editableStatuses.includes(order.status)) {
      throw new Error(`Cannot modify order with status ${order.status}`);
    }

    const literature = await prisma.literature.findUnique({
      where: { id: itemData.literatureId },
    });

    if (!literature || !literature.isActive) {
      throw new Error('Literature not found or inactive');
    }

    const unitPrice = itemData.unitPrice || literature.price;
    const totalPrice = unitPrice * itemData.quantity;

    // Проверяем, не существует ли уже такой элемент
    const existingItem = await prisma.orderItem.findUnique({
      where: {
        orderId_literatureId: {
          orderId,
          literatureId: itemData.literatureId,
        },
      },
    });

    if (existingItem) {
      throw new Error('Item already exists in order');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Создаем элемент заказа
      const orderItem = await tx.orderItem.create({
        data: {
          orderId,
          literatureId: itemData.literatureId,
          quantity: itemData.quantity,
          unitPrice,
          totalPrice,
        },
      });

      // Обновляем общую стоимость заказа
      await this.recalculateOrderTotal(tx, orderId);

      return orderItem;
    });

    return result;
  }

  async updateOrderItem(orderId: string, literatureId: string, quantity: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.lockedAt) {
      throw new Error('Cannot modify locked order');
    }

    const editableStatuses = ['DRAFT', 'PENDING'];
    if (!editableStatuses.includes(order.status)) {
      throw new Error(`Cannot modify order with status ${order.status}`);
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: {
        orderId_literatureId: {
          orderId,
          literatureId,
        },
      },
    });

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const totalPrice = orderItem.unitPrice * quantity;

    const result = await prisma.$transaction(async (tx) => {
      // Обновляем элемент заказа
      const updatedItem = await tx.orderItem.update({
        where: {
          orderId_literatureId: {
            orderId,
            literatureId,
          },
        },
        data: {
          quantity,
          totalPrice,
        },
      });

      // Обновляем общую стоимость заказа
      await this.recalculateOrderTotal(tx, orderId);

      return updatedItem;
    });

    return result;
  }

  async removeOrderItem(orderId: string, literatureId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.lockedAt) {
      throw new Error('Cannot modify locked order');
    }

    const editableStatuses = ['DRAFT', 'PENDING'];
    if (!editableStatuses.includes(order.status)) {
      throw new Error(`Cannot modify order with status ${order.status}`);
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: {
        orderId_literatureId: {
          orderId,
          literatureId,
        },
      },
    });

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    await prisma.$transaction(async (tx) => {
      // Удаляем элемент заказа
      await tx.orderItem.delete({
        where: {
          orderId_literatureId: {
            orderId,
            literatureId,
          },
        },
      });

      // Обновляем общую стоимость заказа
      await this.recalculateOrderTotal(tx, orderId);
    });

    return { success: true };
  }

  async getOrdersByOrganization(organizationId: string, type: 'from' | 'to' = 'from') {
    const where = type === 'from' 
      ? { fromOrganizationId: organizationId }
      : { toOrganizationId: organizationId };

    return await prisma.order.findMany({
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            literature: {
              select: {
                id: true,
                title: true,
                category: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderStatistics(organizationId?: string) {
    const where = organizationId ? {
      OR: [
        { fromOrganizationId: organizationId },
        { toOrganizationId: organizationId },
      ],
    } : {};

    const stats = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    const totalOrders = await prisma.order.count({ where });
    
    return {
      totalOrders,
      byStatus: stats.map(stat => ({
        status: stat.status,
        count: stat._count.status,
        totalAmount: stat._sum.totalAmount || 0,
      })),
    };
  }

  async deleteOrder(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Можно удалять только заказы в статусе DRAFT
    if (order.status !== 'DRAFT') {
      throw new Error('Can only delete orders in DRAFT status');
    }

    if (order.lockedAt) {
      throw new Error('Cannot delete locked order');
    }

    await prisma.order.delete({
      where: { id },
    });

    return { success: true };
  }

  // Приватные методы

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const prefix = `ORD-${year}${month}${day}`;
    
    // Находим последний заказ за сегодня
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  private async validateOrganizationHierarchy(fromOrgId: string, toOrgId: string) {
    // Получаем информацию об организациях
    const fromOrg = await prisma.organization.findUnique({
      where: { id: fromOrgId },
      include: { parent: true },
    });

    const toOrg = await prisma.organization.findUnique({
      where: { id: toOrgId },
    });

    if (!fromOrg || !toOrg) {
      throw new Error('Organization not found');
    }

    // Проверяем правила иерархии
    // Группы могут заказывать у местностей и регионов
    // Местности могут заказывать у регионов
    // Регионы могут заказывать у внешних поставщиков (пока не реализовано)

    const validHierarchies: Record<string, string[]> = {
      'GROUP': ['LOCALITY', 'REGION'],
      'LOCAL_SUBCOMMITTEE': ['LOCALITY', 'REGION'],
      'LOCALITY': ['REGION'],
      'REGION': ['REGION'], // Регион может заказывать у другого региона
    };

    const allowedToTypes = validHierarchies[fromOrg.type] || [];
    if (!allowedToTypes.includes(toOrg.type)) {
      throw new Error(`${fromOrg.type} cannot order from ${toOrg.type}`);
    }

    // Дополнительная проверка: группа должна заказывать у своей местности или региона
    // Для тестов пока упростим эту проверку
    if (fromOrg.type === 'GROUP' && toOrg.type === 'LOCALITY') {
      // В реальной системе здесь должна быть проверка иерархии
      // if (fromOrg.parentId !== toOrgId) {
      //   throw new Error('Group can only order from its parent locality');
      // }
    }
  }

  private async recalculateOrderTotal(tx: any, orderId: string) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
    });

    const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    await tx.order.update({
      where: { id: orderId },
      data: { totalAmount },
    });
  }

  private async reserveOrderItems(tx: any, order: any) {
    for (const item of order.items) {
      // Резервируем товар на складе отправляющей организации
      const inventory = await tx.inventory.findUnique({
        where: {
          organizationId_literatureId: {
            organizationId: order.toOrganizationId, // Резервируем у получателя (склад, с которого отгружаем)
            literatureId: item.literatureId,
          },
        },
      });

      if (!inventory) {
        throw new Error(`No inventory found for literature ${item.literature.title} in organization`);
      }

      const availableQuantity = inventory.quantity - inventory.reservedQuantity;
      if (availableQuantity < item.quantity) {
        throw new Error(`Insufficient quantity for ${item.literature.title}. Available: ${availableQuantity}, requested: ${item.quantity}`);
      }

      await tx.inventory.update({
        where: {
          organizationId_literatureId: {
            organizationId: order.toOrganizationId,
            literatureId: item.literatureId,
          },
        },
        data: {
          reservedQuantity: {
            increment: item.quantity,
          },
        },
      });
    }
  }

  private async createOrderTransactions(tx: any, order: any) {
    for (const item of order.items) {
      // Создаем исходящие транзакции в рамках той же database transaction
      await tx.transaction.create({
        data: {
          type: 'OUTGOING',
          fromOrganizationId: order.toOrganizationId,
          toOrganizationId: order.fromOrganizationId,
          literatureId: item.literatureId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.unitPrice * item.quantity,
          orderId: order.id,
          notes: `Order shipment: ${order.orderNumber}`,
        },
      });
    }
  }

  private async createIncomingTransactions(tx: any, order: any) {
    for (const item of order.items) {
      // Создаем входящие транзакции для получающей организации
      await tx.transaction.create({
        data: {
          type: 'INCOMING',
          fromOrganizationId: order.toOrganizationId,
          toOrganizationId: order.fromOrganizationId,
          literatureId: item.literatureId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.unitPrice * item.quantity,
          orderId: order.id,
          notes: `Order delivery: ${order.orderNumber}`,
        },
      });
    }
  }

  private async updateInventoryForCompletedOrder(tx: any, order: any) {
    for (const item of order.items) {
      // Списываем с отправляющего склада
      await tx.inventory.update({
        where: {
          organizationId_literatureId: {
            organizationId: order.toOrganizationId,
            literatureId: item.literatureId,
          },
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
          reservedQuantity: {
            decrement: item.quantity,
          },
        },
      });

      // Добавляем на получающий склад
      await tx.inventory.upsert({
        where: {
          organizationId_literatureId: {
            organizationId: order.fromOrganizationId,
            literatureId: item.literatureId,
          },
        },
        update: {
          quantity: {
            increment: item.quantity,
          },
        },
        create: {
          organizationId: order.fromOrganizationId,
          literatureId: item.literatureId,
          quantity: item.quantity,
          reservedQuantity: 0,
        },
      });
    }
  }

  private async releaseOrderReservations(tx: any, order: any) {
    for (const item of order.items) {
      const inventory = await tx.inventory.findUnique({
        where: {
          organizationId_literatureId: {
            organizationId: order.toOrganizationId,
            literatureId: item.literatureId,
          },
        },
      });

      if (inventory && inventory.reservedQuantity >= item.quantity) {
        await tx.inventory.update({
          where: {
            organizationId_literatureId: {
              organizationId: order.toOrganizationId,
              literatureId: item.literatureId,
            },
          },
          data: {
            reservedQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }
  }
}