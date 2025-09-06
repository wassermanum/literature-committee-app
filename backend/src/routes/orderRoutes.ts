import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { validateOrderCreation, validateOrderStatusUpdate } from '../middleware/validation.js';

const router = Router();
const orderController = new OrderController();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/orders/statistics - получить статистику заказов
router.get('/statistics', orderController.getOrderStatistics.bind(orderController));

// GET /api/orders/organization/:organizationId - получить заказы организации
router.get('/organization/:organizationId', orderController.getOrdersByOrganization.bind(orderController));

// GET /api/orders - получить все заказы
router.get('/', orderController.getAllOrders.bind(orderController));

// POST /api/orders - создать новый заказ
router.post('/', validateOrderCreation, orderController.createOrder.bind(orderController));

// GET /api/orders/:id - получить заказ по ID
router.get('/:id', orderController.getOrderById.bind(orderController));

// PUT /api/orders/:id - обновить заказ
router.put('/:id', orderController.updateOrder.bind(orderController));

// PUT /api/orders/:id/status - обновить статус заказа
router.put('/:id/status', validateOrderStatusUpdate, orderController.updateOrderStatus.bind(orderController));

// POST /api/orders/:id/lock - заблокировать заказ
router.post('/:id/lock', orderController.lockOrder.bind(orderController));

// POST /api/orders/:id/unlock - разблокировать заказ
router.post('/:id/unlock', orderController.unlockOrder.bind(orderController));

// POST /api/orders/:id/items - добавить элемент в заказ
router.post('/:id/items', orderController.addOrderItem.bind(orderController));

// PUT /api/orders/:id/items/:literatureId - обновить элемент заказа
router.put('/:id/items/:literatureId', orderController.updateOrderItem.bind(orderController));

// DELETE /api/orders/:id/items/:literatureId - удалить элемент из заказа
router.delete('/:id/items/:literatureId', orderController.removeOrderItem.bind(orderController));

// DELETE /api/orders/:id - удалить заказ
router.delete('/:id', orderController.deleteOrder.bind(orderController));

export default router;