import { Request, Response } from 'express';
import { LiteratureService } from '../services/literatureService.js';

const literatureService = new LiteratureService();

export class LiteratureController {
  async getAllLiterature(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      };

      // Удаляем undefined значения
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof typeof filters] === undefined) {
          delete filters[key as keyof typeof filters];
        }
      });

      const literature = await literatureService.getAllLiterature(Object.keys(filters).length > 0 ? filters : undefined);

      res.json({
        success: true,
        data: literature,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLiteratureById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const literature = await literatureService.getLiteratureById(id);

      res.json({
        success: true,
        data: literature,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Literature not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to get literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createLiterature(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, category, price } = req.body;

      // Базовая валидация
      if (!title || !description || !category || price === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Title, description, category, and price are required',
        });
        return;
      }

      const literature = await literatureService.createLiterature({
        title,
        description,
        category,
        price: parseFloat(price),
      });

      res.status(201).json({
        success: true,
        data: literature,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('negative') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateLiterature(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Конвертируем price в число, если он передан
      if (updateData.price !== undefined) {
        updateData.price = parseFloat(updateData.price);
      }

      const literature = await literatureService.updateLiterature(id, updateData);

      res.json({
        success: true,
        data: literature,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Literature not found' ? 404 :
        error instanceof Error && error.message.includes('negative') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteLiterature(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await literatureService.deleteLiterature(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Literature not found' ? 404 :
        error instanceof Error && error.message.includes('active orders') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLiteratureCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await literatureService.getLiteratureCategories();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get literature categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLiteratureInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { organizationId } = req.query;

      const inventory = await literatureService.getLiteratureInventory(
        id,
        organizationId as string
      );

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get literature inventory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async searchLiterature(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
          message: 'Query parameter "q" is required',
        });
        return;
      }

      const literature = await literatureService.searchLiterature(q);

      res.json({
        success: true,
        data: literature,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to search literature',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getLiteratureByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const literature = await literatureService.getLiteratureByCategory(category);

      res.json({
        success: true,
        data: literature,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get literature by category',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateInventory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { organizationId, quantity, reservedQuantity } = req.body;

      // Базовая валидация
      if (!organizationId || quantity === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'OrganizationId and quantity are required',
        });
        return;
      }

      const inventory = await literatureService.updateInventory(
        id,
        organizationId,
        parseInt(quantity),
        reservedQuantity !== undefined ? parseInt(reservedQuantity) : undefined
      );

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('negative') || 
         error.message.includes('exceed')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update inventory',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}