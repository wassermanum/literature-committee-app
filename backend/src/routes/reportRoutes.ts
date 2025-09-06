import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const reportController = new ReportController();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/reports/dashboard - получить данные для дашборда
router.get('/dashboard', reportController.getDashboardData.bind(reportController));

// GET /api/reports/summary - получить краткую сводку по всем отчетам
router.get('/summary', reportController.getReportSummary.bind(reportController));

// GET /api/reports/analytics - получить аналитические данные
router.get('/analytics', reportController.getAnalyticsData.bind(reportController));

// GET /api/reports/orders - отчет по заказам
router.get('/orders', reportController.getOrdersReport.bind(reportController));

// GET /api/reports/inventory - отчет по остаткам
router.get('/inventory', reportController.getInventoryReport.bind(reportController));

// GET /api/reports/movement - отчет по движению товаров
router.get('/movement', reportController.getMovementReport.bind(reportController));

// GET /api/reports/export/:type - экспорт отчетов
router.get('/export/:type', reportController.exportReport.bind(reportController));

export default router;