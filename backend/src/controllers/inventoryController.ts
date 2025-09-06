import { Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService.js';

const inventoryService = new InventoryService();

export class InventoryController {
  async getAllInventory(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        organizationId: req.query.organizationId as string,
        literatureId: req.query.literatureId as string,
        lowStock: req.query.lowStock === 'true',
        lowStockThreshold: req.query.lowStockThreshold ? parseInt(req.query.lowStockThreshold as string) : undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const inventory = await inventoryService.getAllInventory(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get inventory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInventoryByOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const inventory = await inventoryService.getInventoryByOrganization(organizationId);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get inventory by organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInventoryByLiterature(req: Request, res: Response): Promise<void> {
    try {
      const { literatureId } = req.params;
      const inventory = await inventoryService.getInventoryByLiterature(literatureId);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get inventory by literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, literatureId } = req.params;
      const inventory = await inventoryService.getInventoryItem(organizationId, literatureId);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Inventory item not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to get inventory item',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, literatureId } = req.params;
      const { quantity, reservedQuantity } = req.body;

      // Валидация данных
      if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be a non-negative number',
        });
        return;
      }

      if (reservedQuantity !== undefined && (typeof reservedQuantity !== 'number' || reservedQuantity < 0)) {
        res.status(400).json({
          success: false,
          error: 'Invalid reserved quantity',
          message: 'Reserved quantity must be a non-negative number',
        });
        return;
      }

      const inventory = await inventoryService.updateInventory(organizationId, literatureId, {
        quantity,
        reservedQuantity,
      });

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('cannot be negative') ||
         error.message.includes('cannot exceed')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update inventory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async reserveInventory(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, literatureId } = req.params;
      const { quantity } = req.body;

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be a positive number',
        });
        return;
      }

      const inventory = await inventoryService.reserveInventory(organizationId, literatureId, quantity);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('Insufficient')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to reserve inventory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async releaseReservation(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, literatureId } = req.params;
      const { quantity } = req.body;

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be a positive number',
        });
        return;
      }

      const inventory = await inventoryService.releaseReservation(organizationId, literatureId, quantity);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('Cannot release')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to release reservation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async transferInventory(req: Request, res: Response): Promise<void> {
    try {
      const { fromOrganizationId, toOrganizationId, literatureId, quantity, orderId } = req.body;

      // Валидация обязательных полей
      if (!fromOrganizationId || !toOrganizationId || !literatureId || !quantity) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'fromOrganizationId, toOrganizationId, literatureId, and quantity are required',
        });
        return;
      }

      if (typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be a positive number',
        });
        return;
      }

      const result = await inventoryService.transferInventory(
        fromOrganizationId,
        toOrganizationId,
        literatureId,
        quantity,
        orderId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('Insufficient')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to transfer inventory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async bulkUpdateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid updates',
          message: 'Updates must be a non-empty array',
        });
        return;
      }

      // Валидация каждого обновления
      for (const update of updates) {
        if (!update.organizationId || !update.literatureId || typeof update.quantity !== 'number') {
          res.status(400).json({
            success: false,
            error: 'Invalid update data',
            message: 'Each update must have organizationId, literatureId, and quantity',
          });
          return;
        }
      }

      const results = await inventoryService.bulkUpdateInventory(updates);

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to bulk update inventory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLowStockItems(req: Request, res: Response): Promise<void> {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      const organizationId = req.query.organizationId as string;

      if (isNaN(threshold) || threshold < 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid threshold',
          message: 'Threshold must be a non-negative number',
        });
        return;
      }

      const lowStockItems = await inventoryService.getLowStockItems(threshold, organizationId);

      res.json({
        success: true,
        data: lowStockItems,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get low stock items',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getInventoryStatistics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.query.organizationId as string;
      const statistics = await inventoryService.getInventoryStatistics(organizationId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get inventory statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, literatureId } = req.params;
      const result = await inventoryService.deleteInventoryItem(organizationId, literatureId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message === 'Inventory item not found') ? 404 :
        error instanceof Error && error.message.includes('Cannot delete') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete inventory item',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}