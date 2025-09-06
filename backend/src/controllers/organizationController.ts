import { Request, Response } from 'express';
import { OrganizationService } from '../services/organizationService.js';

const organizationService = new OrganizationService();

export class OrganizationController {
  async getAllOrganizations(_req: Request, res: Response): Promise<void> {
    try {
      const organizations = await organizationService.getAllOrganizations();

      res.json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get organizations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getOrganizationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organization = await organizationService.getOrganizationById(id);

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Organization not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to get organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async createOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { name, type, parentId, address, contactPerson, phone, email } = req.body;

      // Базовая валидация
      if (!name || !type || !address || !contactPerson || !phone || !email) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Name, type, address, contactPerson, phone, and email are required',
        });
        return;
      }

      const organization = await organizationService.createOrganization({
        name,
        type,
        parentId,
        address,
        contactPerson,
        phone,
        email,
      });

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || 
         error.message.includes('Invalid') || 
         error.message.includes('hierarchy')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const organization = await organizationService.updateOrganization(id, updateData);

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Organization not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('Invalid') || 
         error.message.includes('hierarchy') || 
         error.message.includes('parent')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteOrganization(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await organizationService.deleteOrganization(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Organization not found' ? 404 :
        error instanceof Error && 
        (error.message.includes('Cannot delete') || 
         error.message.includes('active users') || 
         error.message.includes('child organizations')) ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete organization',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getOrganizationHierarchy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const hierarchy = await organizationService.getOrganizationHierarchy(id);

      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Organization not found' ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to get organization hierarchy',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getOrganizationsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const organizations = await organizationService.getOrganizationsByType(type);

      res.json({
        success: true,
        data: organizations,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message === 'Invalid organization type' ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to get organizations by type',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getChildOrganizations(req: Request, res: Response): Promise<void> {
    try {
      const { parentId } = req.params;
      const children = await organizationService.getChildOrganizations(parentId);

      res.json({
        success: true,
        data: children,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get child organizations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}