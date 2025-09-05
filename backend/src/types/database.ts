// Database types generated from Prisma schema
// This file provides TypeScript types for the database models

export enum UserRole {
  GROUP = 'GROUP',
  LOCAL_SUBCOMMITTEE = 'LOCAL_SUBCOMMITTEE',
  LOCALITY = 'LOCALITY',
  REGION = 'REGION',
  ADMIN = 'ADMIN',
}

export enum OrganizationType {
  GROUP = 'GROUP',
  LOCAL_SUBCOMMITTEE = 'LOCAL_SUBCOMMITTEE',
  LOCALITY = 'LOCALITY',
  REGION = 'REGION',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_ASSEMBLY = 'IN_ASSEMBLY',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum TransactionType {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  ADJUSTMENT = 'ADJUSTMENT',
}

// Base model interfaces
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  parentId: string | null;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Literature {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  status: OrderStatus;
  totalAmount: number;
  notes: string | null;
  lockedAt: Date | null;
  lockedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  literatureId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Inventory {
  id: string;
  organizationId: string;
  literatureId: string;
  quantity: number;
  reservedQuantity: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  fromOrganizationId: string | null;
  toOrganizationId: string;
  literatureId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  orderId: string | null;
  notes: string | null;
  createdAt: Date;
}

// Extended interfaces with relations
export interface UserWithOrganization extends User {
  organization: Organization;
}

export interface OrganizationWithParent extends Organization {
  parent?: Organization;
  children?: Organization[];
}

export interface OrderWithDetails extends Order {
  fromOrganization: Organization;
  toOrganization: Organization;
  lockedBy?: User;
  items: OrderItemWithLiterature[];
}

export interface OrderItemWithLiterature extends OrderItem {
  literature: Literature;
}

export interface InventoryWithDetails extends Inventory {
  organization: Organization;
  literature: Literature;
}

export interface TransactionWithDetails extends Transaction {
  fromOrganization?: Organization;
  toOrganization: Organization;
  literature: Literature;
  order?: Order;
}

// Create/Update DTOs (Data Transfer Objects)
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
}

export interface CreateOrganizationDto {
  name: string;
  type: OrganizationType;
  parentId?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  type?: OrganizationType;
  parentId?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface CreateLiteratureDto {
  title: string;
  description: string;
  category: string;
  price: number;
}

export interface UpdateLiteratureDto {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  isActive?: boolean;
}

export interface CreateOrderDto {
  fromOrganizationId: string;
  toOrganizationId: string;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  literatureId: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  notes?: string;
  items?: CreateOrderItemDto[];
}

export interface CreateInventoryDto {
  organizationId: string;
  literatureId: string;
  quantity: number;
}

export interface UpdateInventoryDto {
  quantity?: number;
  reservedQuantity?: number;
}

export interface CreateTransactionDto {
  type: TransactionType;
  fromOrganizationId?: string;
  toOrganizationId: string;
  literatureId: string;
  quantity: number;
  unitPrice: number;
  orderId?: string;
  notes?: string;
}

// Query filters and pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderFilters extends PaginationParams {
  status?: OrderStatus;
  fromOrganizationId?: string;
  toOrganizationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TransactionFilters extends PaginationParams {
  type?: TransactionType;
  organizationId?: string;
  literatureId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface LiteratureFilters extends PaginationParams {
  category?: string;
  isActive?: boolean;
  search?: string;
}

// Business logic types
export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  allowedRoles: UserRole[];
  requiresLock?: boolean;
}

export interface InventoryMovement {
  organizationId: string;
  literatureId: string;
  quantityChange: number;
  type: 'reserve' | 'release' | 'adjust';
  orderId?: string;
  notes?: string;
}

// Computed fields
export interface OrderSummary {
  totalOrders: number;
  totalAmount: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  categories: Record<string, number>;
}

// Error types
export interface DatabaseError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}