export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  IN_ASSEMBLY = 'in_assembly',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export interface OrderItem {
  id: string;
  orderId: string;
  literatureId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  literature?: Literature;
}

export interface Order {
  id: string;
  orderNumber: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  isEditable: boolean;
  lockedAt?: string;
  lockedBy?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  fromOrganization?: Organization;
  toOrganization?: Organization;
}

export interface Literature {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  parentId?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  toOrganizationId: string;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  literatureId: string;
  quantity: number;
}

export interface UpdateOrderRequest {
  notes?: string;
  items?: UpdateOrderItemRequest[];
}

export interface UpdateOrderItemRequest {
  id?: string;
  literatureId: string;
  quantity: number;
}

export interface OrderFilters {
  status?: OrderStatus[];
  fromDate?: string;
  toDate?: string;
  search?: string;
  fromOrganizationId?: string;
  toOrganizationId?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}