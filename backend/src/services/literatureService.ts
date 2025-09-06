import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateLiteratureData {
  title: string;
  description: string;
  category: string;
  price: number;
}

export interface UpdateLiteratureData {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  isActive?: boolean;
}

export interface LiteratureSearchFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export class LiteratureService {
  async getAllLiterature(filters?: LiteratureSearchFilters) {
    const where: any = {};

    if (filters) {
      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search } },
          { description: { contains: filters.search } },
        ];
      }

      if (filters.minPrice !== undefined) {
        where.price = { ...where.price, gte: filters.minPrice };
      }

      if (filters.maxPrice !== undefined) {
        where.price = { ...where.price, lte: filters.maxPrice };
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
    }

    return await prisma.literature.findMany({
      where,
      include: {
        inventory: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            transactions: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async getLiteratureById(id: string) {
    const literature = await prisma.literature.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                fromOrganization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                toOrganization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        transactions: {
          include: {
            fromOrganization: {
              select: {
                id: true,
                name: true,
              },
            },
            toOrganization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Последние 10 транзакций
        },
        _count: {
          select: {
            orderItems: true,
            transactions: true,
          },
        },
      },
    });

    if (!literature) {
      throw new Error('Literature not found');
    }

    return literature;
  }

  async createLiterature(literatureData: CreateLiteratureData) {
    // Валидируем данные
    if (literatureData.price < 0) {
      throw new Error('Price cannot be negative');
    }

    return await prisma.literature.create({
      data: literatureData,
      include: {
        inventory: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            transactions: true,
          },
        },
      },
    });
  }

  async updateLiterature(id: string, literatureData: UpdateLiteratureData) {
    // Проверяем, что литература существует
    const existingLiterature = await prisma.literature.findUnique({
      where: { id },
    });

    if (!existingLiterature) {
      throw new Error('Literature not found');
    }

    // Валидируем данные
    if (literatureData.price !== undefined && literatureData.price < 0) {
      throw new Error('Price cannot be negative');
    }

    return await prisma.literature.update({
      where: { id },
      data: literatureData,
      include: {
        inventory: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
            transactions: true,
          },
        },
      },
    });
  }

  async deleteLiterature(id: string) {
    // Проверяем, что литература существует
    const existingLiterature = await prisma.literature.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!existingLiterature) {
      throw new Error('Literature not found');
    }

    // Проверяем, есть ли активные заказы с этой литературой
    const activeOrders = existingLiterature.orderItems.filter(
      (item) => 
        item.order.status !== 'COMPLETED' && 
        item.order.status !== 'REJECTED'
    );

    if (activeOrders.length > 0) {
      throw new Error('Cannot delete literature with active orders');
    }

    // Вместо физического удаления, деактивируем литературу
    await prisma.literature.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Literature deactivated successfully' };
  }

  async getLiteratureCategories() {
    const categories = await prisma.literature.groupBy({
      by: ['category'],
      where: {
        isActive: true,
      },
      _count: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.category,
    }));
  }

  async getLiteratureInventory(literatureId: string, organizationId?: string) {
    const where: any = {
      literatureId,
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
          },
        },
        literature: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
      orderBy: {
        organization: {
          name: 'asc',
        },
      },
    });
  }

  async searchLiterature(searchTerm: string) {
    return await prisma.literature.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { category: { contains: searchTerm } },
        ],
      },
      include: {
        inventory: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async getLiteratureByCategory(category: string) {
    return await prisma.literature.findMany({
      where: {
        category,
        isActive: true,
      },
      include: {
        inventory: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async updateInventory(literatureId: string, organizationId: string, quantity: number, reservedQuantity?: number) {
    // Проверяем, что литература и организация существуют
    const literature = await prisma.literature.findUnique({
      where: { id: literatureId },
    });

    if (!literature) {
      throw new Error('Literature not found');
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Проверяем, что количество не отрицательное
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    if (reservedQuantity !== undefined && reservedQuantity < 0) {
      throw new Error('Reserved quantity cannot be negative');
    }

    if (reservedQuantity !== undefined && reservedQuantity > quantity) {
      throw new Error('Reserved quantity cannot exceed total quantity');
    }

    // Обновляем или создаем запись в inventory
    const updateData: any = {
      quantity,
      lastUpdated: new Date(),
    };

    if (reservedQuantity !== undefined) {
      updateData.reservedQuantity = reservedQuantity;
    }

    return await prisma.inventory.upsert({
      where: {
        organizationId_literatureId: {
          organizationId,
          literatureId,
        },
      },
      update: updateData,
      create: {
        organizationId,
        literatureId,
        quantity,
        reservedQuantity: reservedQuantity || 0,
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
            price: true,
          },
        },
      },
    });
  }
}