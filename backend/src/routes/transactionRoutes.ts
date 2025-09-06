import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validateTransactionCreation, validateInventoryAdjustment } from '../middleware/validation.js';

const router = Router();
const transactionController = new TransactionController();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/transactions/statistics - получить статистику транзакций
router.get('/statistics', transactionController.getTransactionStatistics.bind(transactionController));

// GET /api/transactions/movement-report - получить отчет по движению
router.get('/movement-report', transactionController.getMovementReport.bind(transactionController));

// POST /api/transactions/adjustment - создать корректировку остатков
router.post('/adjustment', validateInventoryAdjustment, transactionController.createInventoryAdjustment.bind(transactionController));

// GET /api/transactions/organization/:organizationId - получить транзакции организации
router.get('/organization/:organizationId', transactionController.getTransactionsByOrganization.bind(transactionController));

// GET /api/transactions/literature/:literatureId - получить транзакции по литературе
router.get('/literature/:literatureId', transactionController.getTransactionsByLiterature.bind(transactionController));

// GET /api/transactions/order/:orderId - получить транзакции по заказу
router.get('/order/:orderId', transactionController.getTransactionsByOrder.bind(transactionController));

// GET /api/transactions - получить все транзакции
router.get('/', transactionController.getAllTransactions.bind(transactionController));

// POST /api/transactions - создать новую транзакцию
router.post('/', validateTransactionCreation, transactionController.createTransaction.bind(transactionController));

// GET /api/transactions/:id - получить транзакцию по ID
router.get('/:id', transactionController.getTransactionById.bind(transactionController));

// DELETE /api/transactions/:id - удалить/отменить транзакцию
router.delete('/:id', transactionController.deleteTransaction.bind(transactionController));

export default router;