import { Router } from 'express';
import { LiteratureController } from '../controllers/literatureController.js';
import { authenticate } from '../middleware/auth.js';
import { validateLiteratureCreation, validateLiteratureUpdate, validateInventoryUpdate } from '../middleware/validation.js';

const router = Router();
const literatureController = new LiteratureController();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/literature/categories - получить категории литературы
router.get('/categories', literatureController.getLiteratureCategories.bind(literatureController));

// GET /api/literature/search - поиск литературы
router.get('/search', literatureController.searchLiterature.bind(literatureController));

// GET /api/literature/category/:category - получить литературу по категории
router.get('/category/:category', literatureController.getLiteratureByCategory.bind(literatureController));

// GET /api/literature - получить всю литературу
router.get('/', literatureController.getAllLiterature.bind(literatureController));

// POST /api/literature - создать новую литературу
router.post('/', validateLiteratureCreation, literatureController.createLiterature.bind(literatureController));

// GET /api/literature/:id/inventory - получить остатки литературы
router.get('/:id/inventory', literatureController.getLiteratureInventory.bind(literatureController));

// PUT /api/literature/:id/inventory - обновить остатки литературы
router.put('/:id/inventory', validateInventoryUpdate, literatureController.updateInventory.bind(literatureController));

// GET /api/literature/:id - получить литературу по ID
router.get('/:id', literatureController.getLiteratureById.bind(literatureController));

// PUT /api/literature/:id - обновить литературу
router.put('/:id', validateLiteratureUpdate, literatureController.updateLiterature.bind(literatureController));

// DELETE /api/literature/:id - удалить (деактивировать) литературу
router.delete('/:id', literatureController.deleteLiterature.bind(literatureController));

export default router;