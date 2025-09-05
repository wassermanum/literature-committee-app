import { Prisma } from '@prisma/client';
import { DatabaseError } from '../types/database.js';

/**
 * Handle Prisma errors and convert them to application errors
 */
export function handlePrismaError(error: unknown): DatabaseError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        return {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `${field} already exists`,
          field,
        };

      case 'P2025':
        // Record not found
        return {
          code: 'RECORD_NOT_FOUND',
          message: 'Record not found',
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Referenced record does not exist',
          field: error.meta?.field_name as string,
        };

      case 'P2014':
        // Required relation violation
        return {
          code: 'REQUIRED_RELATION_VIOLATION',
          message: 'Required relation is missing',
        };

      case 'P2016':
        // Query interpretation error
        return {
          code: 'QUERY_INTERPRETATION_ERROR',
          message: 'Query could not be interpreted',
        };

      case 'P2021':
        // Table does not exist
        return {
          code: 'TABLE_NOT_EXISTS',
          message: 'Table does not exist in the database',
        };

      default:
        return {
          code: 'DATABASE_ERROR',
          message: error.message || 'Unknown database error',
        };
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      code: 'UNKNOWN_DATABASE_ERROR',
      message: 'Unknown database error occurred',
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      code: 'DATABASE_PANIC',
      message: 'Database engine panic',
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      code: 'DATABASE_INITIALIZATION_ERROR',
      message: 'Failed to initialize database connection',
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid query parameters',
    };
  }

  // Generic error
  return {
    code: 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Internal server error',
  };
}

/**
 * Generate pagination parameters for Prisma queries
 */
export function getPaginationParams(page?: number, limit?: number) {
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.min(100, Math.max(1, limit || 10));
  
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
  };
}

/**
 * Generate sort parameters for Prisma queries
 */
export function getSortParams(sortBy?: string, sortOrder?: 'asc' | 'desc') {
  if (!sortBy) {
    return { createdAt: 'desc' as const };
  }

  return {
    [sortBy]: sortOrder || 'asc',
  };
}

/**
 * Build date range filter for Prisma queries
 */
export function getDateRangeFilter(dateFrom?: Date, dateTo?: Date) {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const filter: any = {};
  
  if (dateFrom) {
    filter.gte = dateFrom;
  }
  
  if (dateTo) {
    filter.lte = dateTo;
  }

  return filter;
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `ORD-${year}-${timestamp}`;
}

/**
 * Calculate total price for order items
 */
export function calculateOrderTotal(items: Array<{ quantity: number; unitPrice: number }>): number {
  return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
}

/**
 * Validate organization hierarchy for orders
 */
export function validateOrderHierarchy(
  fromOrgType: string,
  toOrgType: string,
  fromParentId?: string,
  toOrgId?: string
): boolean {
  // Groups and local subcommittees can only order from their locality
  if (fromOrgType === 'GROUP' || fromOrgType === 'LOCAL_SUBCOMMITTEE') {
    return toOrgType === 'LOCALITY' && fromParentId === toOrgId;
  }

  // Localities can order from region
  if (fromOrgType === 'LOCALITY') {
    return toOrgType === 'REGION' && fromParentId === toOrgId;
  }

  // Region can send to anyone (exceptional cases)
  if (fromOrgType === 'REGION') {
    return true;
  }

  return false;
}

/**
 * Check if order status transition is valid
 */
export function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    DRAFT: ['PENDING', 'REJECTED'],
    PENDING: ['APPROVED', 'REJECTED', 'DRAFT'],
    APPROVED: ['IN_ASSEMBLY', 'REJECTED'],
    IN_ASSEMBLY: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['COMPLETED'],
    COMPLETED: [],
    REJECTED: ['DRAFT'],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Check if order can be edited based on status
 */
export function isOrderEditable(status: string, lockedAt?: Date): boolean {
  const editableStatuses = ['DRAFT', 'PENDING', 'APPROVED'];
  return editableStatuses.includes(status) && !lockedAt;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(amount);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (Russian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+7\s?\(\d{3,4}\)\s?\d{3}-\d{2}-\d{2}$/;
  return phoneRegex.test(phone);
}

/**
 * Generate CUID-like ID (simplified version)
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${randomPart}`;
}