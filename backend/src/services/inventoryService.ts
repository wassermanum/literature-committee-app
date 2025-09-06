import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface InventoryUpdateData {
  quantity?: number;
  reservedQuantity?: number;
}

export interface InventoryFilters {
  organizationId?: string;
  literatureId?: string;
  lowStock?: boolean;
  lowStockThreshold?: number;
}

export interface BulkInventoryUpdate {
  organizationId: string;
  literatureId: string;
  quantity: number;
}

export class InventoryService {
  async getAllInventory(filters?: InventoryFilters) {
    const where: any = {};

    if (filters) {
      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }

      if (filters.literatureId) {
        where.literatureId = filters.literatureId;
      }

      if (filters.lowStock && filters.lowStockThreshold) {
        where.quantity = {
          lte: filters.lowStockThreshold,
        };
      }
    }

    return await prisma.inventory.findMany({
      where,
      include: {
        organization: {
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
            isActive: true,
          },
        },
      },
      orderBy: [
        { organization: { name: 'asc' } },
        { literature: { title: 'asc' } },
      ],
    });
  }

  async getInventoryByOrganization(organizationId: string) {
    return await prisma.inventory.findMany({
      where: { organizationId },
      include: {
        literature: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            price: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        literature: { title: 'asc' },
      },
    });
  }

  async getInventoryByLiterature(literatureId: string) {
    return await prisma.inventory.findMany({
      where: { literatureId },
      include: {
        organization: {
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
      },
      orderBy: {
        organization: { name: 'asc' },
      },
    });
  }

  async getInventoryItem(organizationId: string, literatureId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
      include: {
        organization: {
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
            description: true,
            category: true,
            price: true,
            isActive: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    return inventory;
  }

  async updateInventory(organizationId: string, literatureId: string, updateData: InventoryUpdateData) {
    // Проверяем, что организация и литература существуют
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    const literature = await prisma.literature.findUnique({
      where: { id: literatureId },
    });

    if (!literature || !literature.isActive) {
      throw new Error('Literature not found or inactive');
    }

    // Проверяем валидность данных
    if (updateData.quantity !== undefined && updateData.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    if (updateData.reservedQuantity !== undefined && updateData.reservedQuantity < 0) {
      throw new Error('Reserved quantity cannot be negative');
    }

    // Если обновляется зарезервированное количество, проверяем, что оно не превышает общее количество
    if (updateData.reservedQuantity !== undefined) {
      const currentInventory = await prisma.inventory.findUnique({
        where: {
          organizationId_literatureId: {
            organizationId,
            literatureId,
          },
        },
      });

      const newQuantity = updateData.quantity !== undefined ? updateData.quantity : (currentInventory?.quantity || 0);
      
      if (updateData.reservedQuantity > newQuantity) {
        throw new Error('Reserved quantity cannot exceed total quantity');
      }
    }

    // Создаем или обновляем запись в inventory
    const inventory = await prisma.inventory.upsert({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
      update: {
        ...updateData,
        lastUpdated: new Date(),
      },
      create: {
        organizationId,
        literatureId,
        quantity: updateData.quantity || 0,
        reservedQuantity: updateData.reservedQuantity || 0,
      },
      include: {
        organization: {
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
    });

    return inventory;
  }

  async reserveInventory(organizationId: string, literatureId: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const inventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    const availableQuantity = inventory.quantity - inventory.reservedQuantity;
    if (availableQuantity < quantity) {
      throw new Error(`Insufficient quantity. Available: ${availableQuantity}, requested: ${quantity}`);
    }

    return await prisma.inventory.update({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
      data: {
        reservedQuantity: {
          increment: quantity,
        },
        lastUpdated: new Date(),
      },
      include: {
        organization: {
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
    });
  }

  async releaseReservation(organizationId: string, literatureId: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const inventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    if (inventory.reservedQuantity < quantity) {
      throw new Error(`Cannot release more than reserved. Reserved: ${inventory.reservedQuantity}, requested: ${quantity}`);
    }

    return await prisma.inventory.update({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
      data: {
        reservedQuantity: {
          decrement: quantity,
        },
        lastUpdated: new Date(),
      },
      include: {
        organization: {
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
    });
  }

  async transferInventory(fromOrganizationId: string, toOrganizationId: string, literatureId: string, quantity: number, orderId?: string) {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    // Проверяем, что организации существуют
    const fromOrg = await prisma.organization.findUnique({ where: { id: fromOrganizationId } });
    const toOrg = await prisma.organization.findUnique({ where: { id: toOrganizationId } });

    if (!fromOrg || !toOrg) {
      throw new Error('One or both organizations not found');
    }

    // Выполняем трансфер в транзакции
    return await prisma.$transaction(async (tx) => {
      // Списываем с отправляющего склада
      const fromInventory = await tx.inventory.findUnique({
        where: {
          organizationId_literatureId: {
            organizationId: fromOrganizationId,
            literatureId,
          },
        },
      });

      if (!fromInventory) {
        throw new Error('Source inventory not found');
      }

      const availableQuantity = fromInventory.quantity - fromInventory.reservedQuantity;
      if (availableQuantity < quantity) {
        throw new Error(`Insufficient quantity in source. Available: ${availableQuantity}, requested: ${quantity}`);
      }

      await tx.inventory.update({
        where: {
          organizationId_literatureId: {
            organizationId: fromOrganizationId,
            literatureId,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
          lastUpdated: new Date(),
        },
      });

      // Добавляем на получающий склад
      await tx.inventory.upsert({
        where: {
          organizationId_literatureId: {
            organizationId: toOrganizationId,
            literatureId,
          },
        },
        update: {
          quantity: {
            increment: quantity,
          },
          lastUpdated: new Date(),
        },
        create: {
          organizationId: toOrganizationId,
          literatureId,
          quantity,
          reservedQuantity: 0,
        },
      });

      // Создаем транзакцию для отслеживания движения
      const literature = await tx.literature.findUnique({ where: { id: literatureId } });
      
      await tx.transaction.create({
        data: {
          type: 'OUTBOUND',
          fromOrganizationId,
          toOrganizationId,
          literatureId,
          quantity,
          unitPrice: literature?.price || 0,
          totalAmount: (literature?.price || 0) * quantity,
          orderId,
          notes: `Transfer from ${fromOrg.name} to ${toOrg.name}`,
        },
      });

      return { success: true, quantity };
    });
  }

  async bulkUpdateInventory(updates: BulkInventoryUpdate[]) {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.updateInventory(
          update.organizationId,
          update.literatureId,
          { quantity: update.quantity }
        );
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: update.organizationId,
          literatureId: update.literatureId,
        });
      }
    }

    return results;
  }

  async getLowStockItems(threshold: number = 10, organizationId?: string) {
    const where: any = {
      quantity: {
        lte: threshold,
      },
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    return await prisma.inventory.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            contactPerson: true,
            email: true,
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
      orderBy: [
        { quantity: 'asc' },
        { organization: { name: 'asc' } },
      ],
    });
  }

  async getInventoryStatistics(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    const totalItems = await prisma.inventory.count({ where });
    
    const totalQuantity = await prisma.inventory.aggregate({
      where,
      _sum: {
        quantity: true,
        reservedQuantity: true,
      },
    });

    const totalValue = await prisma.inventory.findMany({
      where,
      include: {
        literature: {
          select: {
            price: true,
          },
        },
      },
    }).then(items => 
      items.reduce((sum, item) => sum + (item.quantity * item.literature.price), 0)
    );

    const lowStockCount = await prisma.inventory.count({
      where: {
        ...where,
        quantity: {
          lte: 10,
        },
      },
    });

    return {
      totalItems,
      totalQuantity: totalQuantity._sum.quantity || 0,
      totalReserved: totalQuantity._sum.reservedQuantity || 0,
      totalValue: Math.round(totalValue * 100) / 100,
      lowStockCount,
    };
  }

  async deleteInventoryItem(organizationId: string, literatureId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    if (inventory.reservedQuantity > 0) {
      throw new Error('Cannot delete inventory item with reserved quantity');
    }

    await prisma.inventory.delete({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
    });

    return { success: true };
  }
}