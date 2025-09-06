import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message,
        details: error.details,
      });
      return;
    }
    
    next();
  };
};

// Схемы валидации для аутентификации
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION', 'ADMIN').required(),
  organizationId: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

// Схемы валидации для пользователей
export const userCreationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION', 'ADMIN').required(),
  organizationId: Joi.string().required(),
});

export const userUpdateSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  role: Joi.string().valid('GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION', 'ADMIN').optional(),
  organizationId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

export const roleAssignmentSchema = Joi.object({
  role: Joi.string().valid('GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION', 'ADMIN').required(),
});

// Схемы валидации для организаций
export const organizationCreationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION').required(),
  parentId: Joi.string().optional().allow(null),
  address: Joi.string().min(5).max(200).required(),
  contactPerson: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(10).max(20).required(),
  email: Joi.string().email().required(),
});

export const organizationUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid('GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION').optional(),
  parentId: Joi.string().optional().allow(null),
  address: Joi.string().min(5).max(200).optional(),
  contactPerson: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(10).max(20).optional(),
  email: Joi.string().email().optional(),
  isActive: Joi.boolean().optional(),
});

// Схемы валидации для литературы
export const literatureCreationSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(5).max(1000).required(),
  category: Joi.string().min(2).max(100).required(),
  price: Joi.number().min(0).required(),
});

export const literatureUpdateSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().min(5).max(1000).optional(),
  category: Joi.string().min(2).max(100).optional(),
  price: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

export const inventoryUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).optional(),
  reservedQuantity: Joi.number().integer().min(0).optional(),
}).min(1);

// Схемы валидации для заказов
export const orderCreationSchema = Joi.object({
  fromOrganizationId: Joi.string().required(),
  toOrganizationId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      literatureId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: Joi.number().min(0).optional(),
    })
  ).min(1).required(),
  notes: Joi.string().max(500).optional(),
});

export const orderStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'PENDING', 'APPROVED', 'IN_ASSEMBLY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'REJECTED').required(),
  notes: Joi.string().max(500).optional(),
});

export const orderUpdateSchema = Joi.object({
  status: Joi.string().valid('DRAFT', 'PENDING', 'APPROVED', 'IN_ASSEMBLY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'REJECTED').optional(),
  notes: Joi.string().max(500).optional(),
  totalAmount: Joi.number().min(0).optional(),
});

export const orderItemSchema = Joi.object({
  literatureId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).optional(),
});

// Дополнительные схемы валидации для inventory
export const inventoryTransferSchema = Joi.object({
  fromOrganizationId: Joi.string().required(),
  toOrganizationId: Joi.string().required(),
  literatureId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  orderId: Joi.string().optional(),
});

export const bulkInventoryUpdateSchema = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      organizationId: Joi.string().required(),
      literatureId: Joi.string().required(),
      quantity: Joi.number().integer().min(0).required(),
    })
  ).min(1).required(),
});

// Middleware функции валидации
export const validateUserCreation = validate(userCreationSchema);
export const validateUserUpdate = validate(userUpdateSchema);
export const validateRoleAssignment = validate(roleAssignmentSchema);
export const validateOrganizationCreation = validate(organizationCreationSchema);
export const validateOrganizationUpdate = validate(organizationUpdateSchema);
export const validateLiteratureCreation = validate(literatureCreationSchema);
export const validateLiteratureUpdate = validate(literatureUpdateSchema);
export const validateInventoryUpdate = validate(inventoryUpdateSchema);
export const validateOrderCreation = validate(orderCreationSchema);
export const validateOrderStatusUpdate = validate(orderStatusUpdateSchema);
export const validateOrderUpdate = validate(orderUpdateSchema);
export const validateOrderItem = validate(orderItemSchema);

// Схемы валидации для транзакций
export const transactionCreationSchema = Joi.object({
  type: Joi.string().valid('INCOMING', 'OUTGOING', 'ADJUSTMENT').required(),
  fromOrganizationId: Joi.string().optional(),
  toOrganizationId: Joi.string().required(),
  literatureId: Joi.string().required(),
  quantity: Joi.number().not(0).required(),
  unitPrice: Joi.number().min(0).optional(),
  orderId: Joi.string().optional(),
  notes: Joi.string().max(500).optional(),
});

export const inventoryAdjustmentSchema = Joi.object({
  organizationId: Joi.string().required(),
  literatureId: Joi.string().required(),
  quantityChange: Joi.number().not(0).required(),
  reason: Joi.string().min(3).max(100).required(),
  notes: Joi.string().max(500).optional(),
});

// Middleware функции валидации для транзакций
export const validateTransactionCreation = validate(transactionCreationSchema);
export const validateInventoryAdjustment = validate(inventoryAdjustmentSchema);
export const validateInventoryTransfer = validate(inventoryTransferSchema);
export const validateBulkInventoryUpdate = validate(bulkInventoryUpdateSchema);