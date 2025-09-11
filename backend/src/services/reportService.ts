import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OrderReportFilters {
  organizationId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  groupBy?: 'status' | 'organization' | 'month' | 'week';
}

export interface InventoryReportFilters {
  organizationId?: string;
  literatureId?: string;
  category?: string;
  lowStockOnly?: boolean;
  threshold?: number;
}

export interface MovementReportFilters {
  organizationId?: string;
  literatureId?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DashboardFilters {
  organizationId?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

export class ReportService {
  // Отчеты по заказам
  async getOrdersReport(filters?: OrderReportFilters) {
    const where: any = {};
    
    if (filters) {
      if (filters.organizationId) {
        where.OR = [
          { fromOrganizationId: filters.organizationId },
          { toOrganizationId: filters.organizationId },
        ];
      }
      
      if (filters.status) {
        where.status = filters.status;
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

    // Базовая статистика
    const totalOrders = await prisma.order.count({ where });
    const totalAmount = await prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
    });

    // Группировка по статусам
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
      _sum: { totalAmount: true },
    });

    // Группировка по организациям (отправители)
    const ordersByFromOrg = await prisma.order.groupBy({
      by: ['fromOrganizationId'],
      where,
      _count: { fromOrganizationId: true },
      _sum: { totalAmount: true },
    });

    // Получаем информацию об организациях
    const orgIds = ordersByFromOrg.map(item => item.fromOrganizationId);
    const organizations = await prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true, type: true },
    });

    const ordersByFromOrgWithNames = ordersByFromOrg.map(item => {
      const org = organizations.find(o => o.id === item.fromOrganizationId);
      return {
        organizationId: item.fromOrganizationId,
        organizationName: org?.name || 'Unknown',
        organizationType: org?.type || 'Unknown',
        count: item._count.fromOrganizationId,
        totalAmount: item._sum.totalAmount || 0,
      };
    });

    return {
      summary: {
        totalOrders,
        totalAmount: totalAmount._sum.totalAmount || 0,
        averageOrderValue: totalOrders > 0 ? (totalAmount._sum.totalAmount || 0) / totalOrders : 0,
      },
      byStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
        totalAmount: item._sum.totalAmount || 0,
      })),
      byOrganization: ordersByFromOrgWithNames,
      timeSeries: null,
    };
  }

  // Отчеты по остаткам
  async getInventoryReport(filters?: InventoryReportFilters) {
    const where: any = {};
    
    if (filters) {
      if (filters.organizationId) {
        where.organizationId = filters.organizationId;
      }
      
      if (filters.literatureId) {
        where.literatureId = filters.literatureId;
      }
      
      if (filters.lowStockOnly) {
        const threshold = filters.threshold || 10;
        where.quantity = { lte: threshold };
      }
    }

    const inventoryItems = await prisma.inventory.findMany({
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
          },
        },
      },
    });

    // Фильтрация по категории литературы
    const filteredItems = filters?.category 
      ? inventoryItems.filter(item => item.literature.category === filters.category)
      : inventoryItems;

    // Статистика по остаткам
    const totalItems = filteredItems.length;
    const totalQuantity = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalReserved = filteredItems.reduce((sum, item) => sum + item.reservedQuantity, 0);
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.quantity * item.literature.price), 0);
    const lowStockItems = filteredItems.filter(item => item.quantity <= (filters?.threshold || 10));

    // Группировка по организациям
    const byOrganization = this.groupInventoryByOrganization(filteredItems);
    
    // Группировка по категориям
    const byCategory = this.groupInventoryByCategory(filteredItems);

    return {
      summary: {
        totalItems,
        totalQuantity,
        totalReserved,
        availableQuantity: totalQuantity - totalReserved,
        totalValue,
        lowStockCount: lowStockItems.length,
      },
      items: filteredItems.map(item => ({
        id: item.id,
        organization: item.organization,
        literature: item.literature,
        quantity: item.quantity,
        reservedQuantity: item.reservedQuantity,
        availableQuantity: item.quantity - item.reservedQuantity,
        value: item.quantity * item.literature.price,
        isLowStock: item.quantity <= (filters?.threshold || 10),
        lastUpdated: item.lastUpdated,
      })),
      byOrganization,
      byCategory,
      lowStockItems: lowStockItems.map(item => ({
        organization: item.organization.name,
        literature: item.literature.title,
        quantity: item.quantity,
        threshold: filters?.threshold || 10,
      })),
    };
  }

  // Отчеты по движению товаров
  async getMovementReport(filters?: MovementReportFilters) {
    const where: any = {};
    
    if (filters) {
      if (filters.organizationId) {
        where.OR = [
          { fromOrganizationId: filters.organizationId },
          { toOrganizationId: filters.organizationId },
        ];
      }
      
      if (filters.literatureId) {
        where.literatureId = filters.literatureId;
      }
      
      if (filters.type) {
        where.type = filters.type;
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

    // Статистика по движению
    const totalTransactions = transactions.length;
    const totalQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0);
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // Группировка по типам транзакций
    const byType = this.groupTransactionsByType(transactions);
    
    // Группировка по организациям
    const byOrganization = this.groupTransactionsByOrganization(transactions);
    
    // Группировка по литературе
    const byLiterature = this.groupTransactionsByLiterature(transactions);

    return {
      summary: {
        totalTransactions,
        totalQuantity,
        totalAmount,
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        fromOrganization: t.fromOrganization,
        toOrganization: t.toOrganization,
        literature: t.literature,
        quantity: t.quantity,
        unitPrice: t.unitPrice,
        totalAmount: t.totalAmount,
        order: t.order,
        notes: t.notes,
        createdAt: t.createdAt,
      })),
      byType,
      byOrganization,
      byLiterature,
    };
  }

  // Аналитические дашборды
  async getDashboardData(filters?: DashboardFilters) {
    const period = filters?.period || 'month';
    const organizationId = filters?.organizationId;

    // Определяем временной диапазон
    const now = new Date();
    let dateFrom: Date;
    
    switch (period) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default: // month
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    // Получаем данные для дашборда
    const [orderStats, inventoryStats, movementStats, topLiterature] = await Promise.all([
      this.getOrdersReport({ organizationId, dateFrom, dateTo: now }),
      this.getInventoryReport({ organizationId }),
      this.getMovementReport({ organizationId, dateFrom, dateTo: now }),
      this.getTopLiterature(organizationId, dateFrom, now),
    ]);

    // Активность по дням недели
    const weeklyActivity = await this.getWeeklyActivity(organizationId, dateFrom, now);

    return {
      period,
      dateRange: { from: dateFrom, to: now },
      orders: {
        summary: orderStats.summary,
        byStatus: orderStats.byStatus,
        trends: [],
      },
      inventory: {
        summary: inventoryStats.summary,
        lowStock: inventoryStats.lowStockItems,
        byCategory: inventoryStats.byCategory,
      },
      movement: {
        summary: movementStats.summary,
        byType: movementStats.byType,
      },
      topLiterature,
      weeklyActivity,
    };
  }

  // Экспорт отчетов
  async exportReport(type: 'orders' | 'inventory' | 'movement', filters: any, format: 'csv' | 'json' = 'csv') {
    let data: any;
    
    switch (type) {
      case 'orders':
        data = await this.getOrdersReport(filters);
        break;
      case 'inventory':
        data = await this.getInventoryReport(filters);
        break;
      case 'movement':
        data = await this.getMovementReport(filters);
        break;
      default:
        throw new Error('Invalid report type');
    }

    if (format === 'json') {
      return {
        data,
        filename: `${type}_report_${new Date().toISOString().split('T')[0]}.json`,
        contentType: 'application/json',
      };
    }

    // Конвертация в CSV
    const csv = this.convertToCSV(data, type);
    return {
      data: csv,
      filename: `${type}_report_${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv',
    };
  }

  // Приватные методы для группировки и обработки данных

  private groupInventoryByOrganization(items: any[]) {
    const groups: Record<string, any> = {};
    
    items.forEach(item => {
      const orgId = item.organization.id;
      if (!groups[orgId]) {
        groups[orgId] = {
          organization: item.organization,
          totalItems: 0,
          totalQuantity: 0,
          totalReserved: 0,
          totalValue: 0,
        };
      }
      
      groups[orgId].totalItems++;
      groups[orgId].totalQuantity += item.quantity;
      groups[orgId].totalReserved += item.reservedQuantity;
      groups[orgId].totalValue += item.quantity * item.literature.price;
    });
    
    return Object.values(groups);
  }

  private groupInventoryByCategory(items: any[]) {
    const groups: Record<string, any> = {};
    
    items.forEach(item => {
      const category = item.literature.category;
      if (!groups[category]) {
        groups[category] = {
          category,
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
        };
      }
      
      groups[category].totalItems++;
      groups[category].totalQuantity += item.quantity;
      groups[category].totalValue += item.quantity * item.literature.price;
    });
    
    return Object.values(groups);
  }

  private groupTransactionsByType(transactions: any[]) {
    const groups: Record<string, any> = {};
    
    transactions.forEach(t => {
      if (!groups[t.type]) {
        groups[t.type] = {
          type: t.type,
          count: 0,
          totalQuantity: 0,
          totalAmount: 0,
        };
      }
      
      groups[t.type].count++;
      groups[t.type].totalQuantity += t.quantity;
      groups[t.type].totalAmount += t.totalAmount;
    });
    
    return Object.values(groups);
  }

  private groupTransactionsByOrganization(transactions: any[]) {
    const groups: Record<string, any> = {};
    
    transactions.forEach(t => {
      // Группируем по отправляющей организации
      if (t.fromOrganization) {
        const orgId = t.fromOrganization.id;
        if (!groups[orgId]) {
          groups[orgId] = {
            organization: t.fromOrganization,
            outgoing: { count: 0, totalQuantity: 0, totalAmount: 0 },
            incoming: { count: 0, totalQuantity: 0, totalAmount: 0 },
          };
        }
        
        groups[orgId].outgoing.count++;
        groups[orgId].outgoing.totalQuantity += t.quantity;
        groups[orgId].outgoing.totalAmount += t.totalAmount;
      }
      
      // Группируем по получающей организации
      if (t.toOrganization) {
        const orgId = t.toOrganization.id;
        if (!groups[orgId]) {
          groups[orgId] = {
            organization: t.toOrganization,
            outgoing: { count: 0, totalQuantity: 0, totalAmount: 0 },
            incoming: { count: 0, totalQuantity: 0, totalAmount: 0 },
          };
        }
        
        groups[orgId].incoming.count++;
        groups[orgId].incoming.totalQuantity += t.quantity;
        groups[orgId].incoming.totalAmount += t.totalAmount;
      }
    });
    
    return Object.values(groups);
  }

  private groupTransactionsByLiterature(transactions: any[]) {
    const groups: Record<string, any> = {};
    
    transactions.forEach(t => {
      const litId = t.literature.id;
      if (!groups[litId]) {
        groups[litId] = {
          literature: t.literature,
          count: 0,
          totalQuantity: 0,
          totalAmount: 0,
        };
      }
      
      groups[litId].count++;
      groups[litId].totalQuantity += t.quantity;
      groups[litId].totalAmount += t.totalAmount;
    });
    
    return Object.values(groups).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  private async getTopLiterature(organizationId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {};
    
    if (organizationId) {
      where.OR = [
        { fromOrganizationId: organizationId },
        { toOrganizationId: organizationId },
      ];
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {where.createdAt.gte = dateFrom;}
      if (dateTo) {where.createdAt.lte = dateTo;}
    }

    const transactions = await prisma.transaction.findMany({
      where,
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
    });

    return this.groupTransactionsByLiterature(transactions).slice(0, 10);
  }

  private async getWeeklyActivity(organizationId?: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = {};
    
    if (organizationId) {
      where.OR = [
        { fromOrganizationId: organizationId },
        { toOrganizationId: organizationId },
      ];
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {where.createdAt.gte = dateFrom;}
      if (dateTo) {where.createdAt.lte = dateTo;}
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activity = weekdays.map(day => ({ day, count: 0, totalAmount: 0 }));

    orders.forEach(order => {
      const dayIndex = new Date(order.createdAt).getDay();
      activity[dayIndex].count++;
      activity[dayIndex].totalAmount += order.totalAmount || 0;
    });

    return activity;
  }

  private convertToCSV(data: any, type: string): string {
    let csv = '';
    
    switch (type) {
      case 'orders':
        csv = 'Status,Count,Total Amount\n';
        data.byStatus.forEach((item: any) => {
          csv += `${item.status},${item.count},${item.totalAmount}\n`;
        });
        break;
        
      case 'inventory':
        csv = 'Organization,Literature,Category,Quantity,Reserved,Available,Value\n';
        data.items.forEach((item: any) => {
          csv += `"${item.organization.name}","${item.literature.title}","${item.literature.category}",${item.quantity},${item.reservedQuantity},${item.availableQuantity},${item.value}\n`;
        });
        break;
        
      case 'movement':
        csv = 'Date,Type,From,To,Literature,Quantity,Amount\n';
        data.transactions.forEach((item: any) => {
          csv += `${item.createdAt.toISOString().split('T')[0]},${item.type},"${item.fromOrganization?.name || ''}","${item.toOrganization?.name || ''}","${item.literature.title}",${item.quantity},${item.totalAmount}\n`;
        });
        break;
    }
    
    return csv;
  }
}