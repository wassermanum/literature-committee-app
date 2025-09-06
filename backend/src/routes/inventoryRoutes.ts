import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';
import { validateInventoryUpdate, validateInventoryTransfer, validateBulkInventoryUpdate } from '../middleware/validation.js';

const router = Router();
const inventoryController = new InventoryController();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/inventory/statistics - получить статистику по складским остаткам
router.get('/statistics', inventoryController.getInventoryStatistics.bind(inventoryController));

// GET /api/inventory/low-stock - получить товары с низкими остатками
router.get('/low-stock', inventoryController.getLowStockItems.bind(inventoryController));

// POST /api/inventory/transfer - перемещение товаров между складами
router.post('/transfer', validateInventoryTransfer, inventoryController.transferInventory.bind(inventoryController));

// POST /api/inventory/bulk-update - массовое обновление остатков
router.post('/bulk-update', validateBulkInventoryUpdate, inventoryController.bulkUpdateInventory.bind(inventoryController));

// GET /api/inventory/organization/:organizationId - получить остатки по организации
router.get('/organization/:organizationId', inventoryController.getInventoryByOrganization.bind(inventoryController));

// GET /api/inventory/literature/:literatureId - получить остатки по литературе
router.get('/literature/:literatureId', inventoryController.getInventoryByLiterature.bind(inventoryController));

// GET /api/inventory - получить все остатки
router.get('/', inventoryController.getAllInventory.bind(inventoryController));

// GET /api/inventory/:organizationId/:literatureId - получить конкретный остаток
router.get('/:organizationId/:literatureId', inventoryController.getInventoryItem.bind(inventoryController));

// PUT /api/inventory/:organizationId/:literatureId - обновить остаток
router.put('/:organizationId/:literatureId', validateInventoryUpdate, inventoryController.updateInventory.bind(inventoryController));

// POST /api/inventory/:organizationId/:literatureId/reserve - зарезервировать товар
router.post('/:organizationId/:literatureId/reserve', inventoryController.reserveInventory.bind(inventoryController));

// POST /api/inventory/:organizationId/:literatureId/release - освободить резерв
router.post('/:organizationId/:literatureId/release', inventoryController.releaseReservation.bind(inventoryController));

// DELETE /api/inventory/:organizationId/:literatureId - удалить остаток
router.delete('/:organizationId/:literatureId', inventoryController.deleteInventoryItem.bind(inventoryController));

export default router;