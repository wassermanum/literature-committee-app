import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService.js';

const transactionService = new TransactionService();

export class TransactionController {
  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        type: req.query.type as string,
        fromOrganizationId: req.query.fromOrganizationId as string,
        toOrganizationId: req.query.toOrganizationId as string,
        literatureId: req.query.literatureId as string,
        orderId: req.query.orderId as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const transactions = await transactionService.getAllTransactions(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(id);

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Transaction not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to get transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { type, fromOrganizationId, toOrganizationId, literatureId, quantity, unitPrice, orderId, notes } = req.body;

      // Базовая валидация
      if (!type || !toOrganizationId || !literatureId || quantity === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Type, toOrganizationId, literatureId, and quantity are required',
        });
        return;
      }

      // Валидация типа транзакции
      const validTypes = ['INCOMING', 'OUTGOING', 'ADJUSTMENT'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Invalid transaction type',
          message: `Type must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }

      // Валидация количества
      if (typeof quantity !== 'number' || quantity === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be a non-zero number',
        });
        return;
      }

      const transaction = await transactionService.createTransaction({
        type,
        fromOrganizationId,
        toOrganizationId,
        literatureId,
        quantity,
        unitPrice,
        orderId,
        notes,
      });

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('Insufficient') || 
         error.message.includes('Invalid')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createInventoryAdjustment(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, literatureId, quantityChange, reason, notes } = req.body;

      // Базовая валидация
      if (!organizationId || !literatureId || quantityChange === undefined || !reason) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'OrganizationId, literatureId, quantityChange, and reason are required',
        });
        return;
      }

      // Валидация количества
      if (typeof quantityChange !== 'number' || quantityChange === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid quantity change',
          message: 'Quantity change must be a non-zero number',
        });
        return;
      }

      const transaction = await transactionService.createInventoryAdjustment({
        organizationId,
        literatureId,
        quantityChange,
        reason,
        notes,
      });

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('would result in negative')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create inventory adjustment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTransactionsByOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId } = req.params;
      const { type } = req.query;

      const transactionType = ['from', 'to', 'all'].includes(type as string) 
        ? (type as 'from' | 'to' | 'all') 
        : 'all';

      const transactions = await transactionService.getTransactionsByOrganization(organizationId, transactionType);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get transactions by organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTransactionsByLiterature(req: Request, res: Response): Promise<void> {
    try {
      const { literatureId } = req.params;
      const transactions = await transactionService.getTransactionsByLiterature(literatureId);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get transactions by literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTransactionsByOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const transactions = await transactionService.getTransactionsByOrder(orderId);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get transactions by order',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getTransactionStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, dateFrom, dateTo } = req.query;
      
      const statistics = await transactionService.getTransactionStatistics(
        organizationId as string,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get transaction statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getMovementReport(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, literatureId, dateFrom, dateTo } = req.query;
      
      const report = await transactionService.getMovementReport(
        organizationId as string,
        literatureId as string,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get movement report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await transactionService.deleteTransaction(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Transaction not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('Cannot delete') || 
         error.message.includes('linked to')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}