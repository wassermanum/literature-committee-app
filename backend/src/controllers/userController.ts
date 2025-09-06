import { Request, Response } from 'express';
import { UserService } from '../services/userService.js';

const userService = new UserService();

export class UserController {
  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      
      // Убираем пароли из всех пользователей
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({
        success: true,
        data: usersWithoutPasswords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get users',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'User not found' ? 404 : 500;
      
      res.status(statusCode).json({
        success: false,
        error: 'Failed to get user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, organizationId } = req.body;

      // Базовая валидация
      if (!email || !password || !firstName || !lastName || !role || !organizationId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Email, password, firstName, lastName, role, and organizationId are required',
        });
        return;
      }

      const user = await userService.createUser({
        email,
        password,
        firstName,
        lastName,
        role,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('already exists') || error.message.includes('not found')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await userService.updateUser(id, updateData);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message === 'User not found' || error.message.includes('not found')) ? 404 :
        error instanceof Error && error.message.includes('already exists') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'User not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUsersByOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const users = await userService.getUsersByOrganization(organizationId);

      // Убираем пароли из всех пользователей
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({
        success: true,
        data: usersWithoutPasswords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get users by organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      const users = await userService.getUsersByRole(role);

      // Убираем пароли из всех пользователей
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json({
        success: true,
        data: usersWithoutPasswords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get users by role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        res.status(400).json({
          success: false,
          error: 'Role is required',
        });
        return;
      }

      const user = await userService.assignRole(id, role);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message === 'User not found') ? 404 :
        error instanceof Error && error.message === 'Invalid role' ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to assign role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}