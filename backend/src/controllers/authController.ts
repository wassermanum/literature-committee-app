import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { verifyToken } from '../utils/jwt.js';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login({ email, password });
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, organizationId } = req.body;
      
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        role,
        organizationId,
      });
      
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required',
        });
        return;
      }

      // Верифицируем refresh token
      const decoded = verifyToken(refreshToken);
      const result = await authService.refreshToken(decoded.userId);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      
      await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );
      
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Password change failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const user = await authService.getUserProfile(req.user.userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Убираем пароль из ответа
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    // В простой реализации JWT logout не требует серверной логики
    // В продакшене можно добавить blacklist токенов в Redis
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}