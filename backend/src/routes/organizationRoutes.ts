import { Router } from 'express';
import { OrganizationController } from '../controllers/organizationController.js';
import { authenticate } from '../middleware/auth.js';
import { validateOrganizationCreation, validateOrganizationUpdate } from '../middleware/validation.js';

const router = Router();
const organizationController = new OrganizationController();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/organizations/type/:type - получить организации по типу
router.get('/type/:type', organizationController.getOrganizationsByType.bind(organizationController));

// GET /api/organizations - получить все организации
router.get('/', organizationController.getAllOrganizations.bind(organizationController));

// POST /api/organizations - создать новую организацию
router.post('/', validateOrganizationCreation, organizationController.createOrganization.bind(organizationController));

// GET /api/organizations/:id/hierarchy - получить иерархию организации
router.get('/:id/hierarchy', organizationController.getOrganizationHierarchy.bind(organizationController));

// GET /api/organizations/:parentId/children - получить дочерние организации
router.get('/:parentId/children', organizationController.getChildOrganizations.bind(organizationController));

// GET /api/organizations/:id - получить организацию по ID
router.get('/:id', organizationController.getOrganizationById.bind(organizationController));

// PUT /api/organizations/:id - обновить организацию
router.put('/:id', validateOrganizationUpdate, organizationController.updateOrganization.bind(organizationController));

// DELETE /api/organizations/:id - удалить (деактивировать) организацию
router.delete('/:id', organizationController.deleteOrganization.bind(organizationController));

export default router;