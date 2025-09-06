import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validateUserCreation, validateUserUpdate, validateRoleAssignment } from '../middleware/validation.js';

const router = Router();
const userController = new UserController();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/users/organization/:organizationId - получить пользователей по организации
router.get('/organization/:organizationId', userController.getUsersByOrganization.bind(userController));

// GET /api/users/role/:role - получить пользователей по роли
router.get('/role/:role', userController.getUsersByRole.bind(userController));

// GET /api/users - получить всех пользователей
router.get('/', userController.getAllUsers.bind(userController));

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', userController.getUserById.bind(userController));

// POST /api/users - создать нового пользователя
router.post('/', validateUserCreation, userController.createUser.bind(userController));

// PUT /api/users/:id/role - назначить роль пользователю
router.put('/:id/role', validateRoleAssignment, userController.assignRole.bind(userController));

// PUT /api/users/:id - обновить пользователя
router.put('/:id', validateUserUpdate, userController.updateUser.bind(userController));

// DELETE /api/users/:id - удалить (деактивировать) пользователя
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;