import { Request, Response } from 'express';
import { ReportService } from '../services/reportService.js';

const reportService = new ReportService();

export class ReportController {
  async getOrdersReport(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        organizationId: req.query.organizationId as string,
        status: req.query.status as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        groupBy: req.query.groupBy as 'status' | 'organization' | 'month' | 'week' | undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const report = await reportService.getOrdersReport(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate orders report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInventoryReport(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        organizationId: req.query.organizationId as string,
        literatureId: req.query.literatureId as string,
        category: req.query.category as string,
        lowStockOnly: req.query.lowStockOnly === 'true',
        threshold: req.query.threshold ? parseInt(req.query.threshold as string) : undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const report = await reportService.getInventoryReport(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate inventory report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getMovementReport(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        organizationId: req.query.organizationId as string,
        literatureId: req.query.literatureId as string,
        type: req.query.type as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const report = await reportService.getMovementReport(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate movement report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        organizationId: req.query.organizationId as string,
        period: req.query.period as 'week' | 'month' | 'quarter' | 'year' | undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const dashboard = await reportService.getDashboardData(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const format = (req.query.format as 'csv' | 'json') || 'csv';

      if (!['orders', 'inventory', 'movement'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid report type',
          message: 'Report type must be one of: orders, inventory, movement',
        });
        return;
      }

      // Получаем фильтры в зависимости от типа отчета
      let filters: any = {};
      
      switch (type) {
        case 'orders':
          filters = {
            organizationId: req.query.organizationId as string,
            status: req.query.status as string,
            dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
            dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
          };
          break;
          
        case 'inventory':
          filters = {
            organizationId: req.query.organizationId as string,
            literatureId: req.query.literatureId as string,
            category: req.query.category as string,
            lowStockOnly: req.query.lowStockOnly === 'true',
            threshold: req.query.threshold ? parseInt(req.query.threshold as string) : undefined,
          };
          break;
          
        case 'movement':
          filters = {
            organizationId: req.query.organizationId as string,
            literatureId: req.query.literatureId as string,
            type: req.query.type as string,
            dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
            dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
          };
          break;
      }

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const exportData = await reportService.exportReport(
        type as 'orders' | 'inventory' | 'movement',
        Object.keys(filters).length > 0 ? filters : undefined,
        format
      );

      // Устанавливаем заголовки для скачивания файла
      res.setHeader('Content-Type', exportData.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      
      if (format === 'json') {
        res.json(exportData.data);
      } else {
        res.send(exportData.data);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to export report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getReportSummary(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;

      // Получаем краткую сводку по всем типам отчетов
      const [ordersReport, inventoryReport, movementReport] = await Promise.all([
        reportService.getOrdersReport({ organizationId }),
        reportService.getInventoryReport({ organizationId }),
        reportService.getMovementReport({ organizationId }),
      ]);

      const summary = {
        orders: {
          total: ordersReport.summary.totalOrders,
          totalAmount: ordersReport.summary.totalAmount,
          averageValue: ordersReport.summary.averageOrderValue,
          byStatus: ordersReport.byStatus,
        },
        inventory: {
          totalItems: inventoryReport.summary.totalItems,
          totalQuantity: inventoryReport.summary.totalQuantity,
          totalValue: inventoryReport.summary.totalValue,
          lowStockCount: inventoryReport.summary.lowStockCount,
        },
        movement: {
          totalTransactions: movementReport.summary.totalTransactions,
          totalQuantity: movementReport.summary.totalQuantity,
          totalAmount: movementReport.summary.totalAmount,
        },
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate report summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getAnalyticsData(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;
      const period = req.query.period as 'week' | 'month' | 'quarter' | 'year' || 'month';
      const metric = req.query.metric as string;

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

      let analyticsData: any = {};

      switch (metric) {
        case 'orders':
          analyticsData = await reportService.getOrdersReport({
            organizationId,
            dateFrom,
            dateTo: now,
            groupBy: period === 'week' ? 'week' : 'month',
          });
          break;
          
        case 'inventory':
          analyticsData = await reportService.getInventoryReport({ organizationId });
          break;
          
        case 'movement':
          analyticsData = await reportService.getMovementReport({
            organizationId,
            dateFrom,
            dateTo: now,
          });
          break;
          
        default:
          // Возвращаем общую аналитику
          analyticsData = await reportService.getDashboardData({ organizationId, period });
      }

      res.json({
        success: true,
        data: analyticsData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}