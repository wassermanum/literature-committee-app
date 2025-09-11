import httpClient from './httpClient';
import {
  Order,
  OrdersResponse,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters,
  OrderStatus,
} from '../types/orders';

export const ordersService = {
  // Получить список заказов с фильтрацией и пагинацией
  async getOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.fromOrganizationId) params.append('fromOrganizationId', filters.fromOrganizationId);
    if (filters.toOrganizationId) params.append('toOrganizationId', filters.toOrganizationId);
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await httpClient.get<OrdersResponse>(`/orders?${params.toString()}`);
    return response.data;
  },

  // Получить заказ по ID
  async getOrderById(id: string): Promise<Order> {
    const response = await httpClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // Создать новый заказ
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await httpClient.post<Order>('/orders', orderData);
    return response.data;
  },

  // Обновить заказ
  async updateOrder(id: string, orderData: UpdateOrderRequest): Promise<Order> {
    const response = await httpClient.put<Order>(`/orders/${id}`, orderData);
    return response.data;
  },

  // Удалить заказ
  async deleteOrder(id: string): Promise<void> {
    await httpClient.delete(`/orders/${id}`);
  },

  // Изменить статус заказа
  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await httpClient.put<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Заблокировать редактирование заказа
  async lockOrder(id: string): Promise<Order> {
    const response = await httpClient.put<Order>(`/orders/${id}/lock`);
    return response.data;
  },

  // Разблокировать редактирование заказа
  async unlockOrder(id: string): Promise<Order> {
    const response = await httpClient.put<Order>(`/orders/${id}/unlock`);
    return response.data;
  },

  // Получить доступные организации для заказа
  async getAvailableOrganizations(): Promise<any[]> {
    const response = await httpClient.get('/orders/organizations');
    return response.data;
  },

  // Получить каталог литературы для заказа
  async getLiteratureForOrder(): Promise<any[]> {
    const response = await httpClient.get('/literature');
    return response.data;
  },
};

export default ordersService;