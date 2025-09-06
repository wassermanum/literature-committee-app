import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, loginSchema, registerSchema, changePasswordSchema } from '../middleware/validation.js';

const router = Router();
const authController = new AuthController();

// Публичные маршруты
router.post('/login', validate(loginSchema), authController.login.bind(authController));
router.post('/register', validate(registerSchema), authController.register.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Защищенные маршруты
router.use(authenticate); // Все маршруты ниже требуют аутентификации

router.get('/profile', authController.getProfile.bind(authController));
router.post('/change-password', validate(changePasswordSchema), authController.changePassword.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;