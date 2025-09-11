import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/services/ordersService';
import {
  Order,
  OrderFilters,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderStatus,
} from '@/types/orders';
import toast from 'react-hot-toast';

// Ключи для кэширования
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters, page: number, limit: number) =>
    [...orderKeys.lists(), { filters, page, limit }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  organizations: () => [...orderKeys.all, 'organizations'] as const,
  literature: () => [...orderKeys.all, 'literature'] as const,
};

// Хук для получения списка заказов
export const useOrders = (
  filters: OrderFilters = {},
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: orderKeys.list(filters, page, limit),
    queryFn: () => ordersService.getOrders(filters, page, limit),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};

// Хук для получения заказа по ID
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersService.getOrderById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 минуты
  });
};

// Хук для получения доступных организаций
export const useAvailableOrganizations = () => {
  return useQuery({
    queryKey: orderKeys.organizations(),
    queryFn: () => ordersService.getAvailableOrganizations(),
    staleTime: 10 * 60 * 1000, // 10 минут
  });
};

// Хук для получения каталога литературы
export const useLiteratureForOrder = () => {
  return useQuery({
    queryKey: orderKeys.literature(),
    queryFn: () => ordersService.getLiteratureForOrder(),
    staleTime: 10 * 60 * 1000, // 10 минут
  });
};

// Хук для создания заказа
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) =>
      ordersService.createOrder(orderData),
    onSuccess: (newOrder) => {
      // Инвалидируем кэш списков заказов
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      // Добавляем новый заказ в кэш
      queryClient.setQueryData(orderKeys.detail(newOrder.id), newOrder);
      
      toast.success('Заказ успешно создан');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Ошибка при создании заказа';
      toast.error(errorMessage);
    },
  });
};

// Хук для обновления заказа
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) =>
      ordersService.updateOrder(id, data),
    onSuccess: (updatedOrder) => {
      // Обновляем кэш заказа
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      
      // Инвалидируем кэш списков заказов
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      toast.success('Заказ успешно обновлен');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Ошибка при обновлении заказа';
      toast.error(errorMessage);
    },
  });
};

// Хук для удаления заказа
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.deleteOrder(id),
    onSuccess: (_, deletedId) => {
      // Удаляем заказ из кэша
      queryClient.removeQueries({ queryKey: orderKeys.detail(deletedId) });
      
      // Инвалидируем кэш списков заказов
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      toast.success('Заказ успешно удален');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Ошибка при удалении заказа';
      toast.error(errorMessage);
    },
  });
};

// Хук для изменения статуса заказа
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      // Обновляем кэш заказа
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      
      // Инвалидируем кэш списков заказов
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      
      toast.success('Статус заказа успешно изменен');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Ошибка при изменении статуса заказа';
      toast.error(errorMessage);
    },
  });
};

// Хук для блокировки заказа
export const useLockOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.lockOrder(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Заказ заблокирован для редактирования');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Ошибка при блокировке заказа';
      toast.error(errorMessage);
    },
  });
};

// Хук для разблокировки заказа
export const useUnlockOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.unlockOrder(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), updatedOrder);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Заказ разблокирован для редактирования');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Ошибка при разблокировке заказа';
      toast.error(errorMessage);
    },
  });
};