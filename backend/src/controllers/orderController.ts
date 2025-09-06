import { Request, Response } from 'express';
import { OrderService } from '../services/orderService.js';

const orderService = new OrderService();

export class OrderController {
  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        fromOrganizationId: req.query.fromOrganizationId as string,
        toOrganizationId: req.query.toOrganizationId as string,
        createdById: req.query.createdById as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const orders = await orderService.getAllOrders(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(id);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Order not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to get order',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { fromOrganizationId, toOrganizationId, items, notes } = req.body;
      const userId = (req as any).user?.userId;

      // Базовая валидация
      if (!fromOrganizationId || !toOrganizationId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'FromOrganizationId, toOrganizationId, and items array are required',
        });
        return;
      }

      // Валидация элементов заказа
      for (const item of items) {
        if (!item.literatureId || !item.quantity || item.quantity <= 0) {
          res.status(400).json({
            success: false,
            error: 'Invalid item data',
            message: 'Each item must have literatureId and positive quantity',
          });
          return;
        }
      }

      const order = await orderService.createOrder({
        fromOrganizationId,
        toOrganizationId,
        items,
        notes,
        createdById: userId,
      });

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('cannot order') || 
         error.message.includes('Insufficient') || 
         error.message.includes('No inventory')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const order = await orderService.updateOrder(id, updateData);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Order not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('locked') || 
         error.message.includes('Invalid status transition')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update order',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = (req as any).user?.userId;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
        });
        return;
      }

      // Валидируем статус
      const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'IN_ASSEMBLY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      const order = await orderService.updateOrderStatus(id, status, notes, userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Order not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('Invalid status transition') || 
         error.message.includes('Insufficient')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update order status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async lockOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const order = await orderService.lockOrder(id, userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Order not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('already locked') || 
         error.message.includes('Cannot lock')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to lock order',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async unlockOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const order = await orderService.unlockOrder(id, userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Order not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('not locked') || 
         error.message.includes('Only the user')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to unlock order',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async addOrderItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { literatureId, quantity, unitPrice } = req.body;

      if (!literatureId || !quantity || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid item data',
          message: 'LiteratureId and positive quantity are required',
        });
        return;
      }

      const orderItem = await orderService.addOrderItem(id, {
        literatureId,
        quantity,
        unitPrice,
      });

      res.status(201).json({
        success: true,
        data: orderItem,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message === 'Order not found' || 
         error.message === 'Literature not found or inactive') ? 404 :
        error instanceof Error && 
        (error.message.includes('locked') || 
         error.message.includes('Cannot modify') ||
         error.message.includes('already exists')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to add order item',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateOrderItem(req: Request, res: Response): Promise<void> {
    try {
      const { id, literatureId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Positive quantity is required',
        });
        return;
      }

      const orderItem = await orderService.updateOrderItem(id, literatureId, quantity);

      res.json({
        success: true,
        data: orderItem,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message === 'Order not found' || 
         error.message === 'Order item not found') ? 404 :
        error instanceof Error && 
        (error.message.includes('locked') || 
         error.message.includes('Cannot modify')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update order item',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async removeOrderItem(req: Request, res: Response): Promise<void> {
    try {
      const { id, literatureId } = req.params;

      const result = await orderService.removeOrderItem(id, literatureId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message === 'Order not found' || 
         error.message === 'Order item not found') ? 404 :
        error instanceof Error && 
        (error.message.includes('locked') || 
         error.message.includes('Cannot modify')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to remove order item',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getOrdersByOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { type } = req.query;

      const orderType = (type === 'to') ? 'to' : 'from';
      const orders = await orderService.getOrdersByOrganization(organizationId, orderType);

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get orders by organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getOrderStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.query;
      
      const statistics = await orderService.getOrderStatistics(organizationId as string);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get order statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await orderService.deleteOrder(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Order not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('Can only delete') || 
         error.message.includes('Cannot delete locked')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete order',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}