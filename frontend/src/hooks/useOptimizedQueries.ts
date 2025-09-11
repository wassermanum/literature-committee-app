import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig, cacheUtils } from '@/config/queryClient';
import { ordersService } from '@/services/ordersService';
import { authService } from '@/services/authService';
import GlobalErrorHandler from '@/utils/errorHandler';

// Интерфейсы для пагинации
interface PaginationParams {
  page?: number;
  limit?: number;
}

interface InfiniteQueryParams extends PaginationParams {
  filters?: any;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Оптимизированные хуки для заказов
export const useOptimizedOrders = () => {
  const queryClient = useQueryClient();

  // Получение списка заказов с кэшированием
  const useOrdersList = (filters: any = {}, options: PaginationParams = {}) => {
    return useQuery({
      queryKey: queryKeys.orders.list({ ...filters, ...options }),
      queryFn: () => ordersService.getOrders(filters, options.page, options.limit),
      staleTime: cacheConfig.dynamic.staleTime,
      cacheTime: cacheConfig.dynamic.cacheTime,
      keepPreviousData: true, // Сохраняем предыдущие данные при смене страниц
      meta: {
        showErrorToast: true,
      },
    });
  };

  // Бесконечная прокрутка для заказов
  const useInfiniteOrders = (filters: any = {}) => {
    return useInfiniteQuery({
      queryKey: queryKeys.orders.list(filters),
      queryFn: ({ pageParam = 1 }) => 
        ordersService.getOrders(filters, pageParam, 20),
      getNextPageParam: (lastPage: any) => {
        const { pagination } = lastPage;
        return pagination.hasNextPage ? pagination.page + 1 : undefined;
      },
      staleTime: cacheConfig.dynamic.staleTime,
      cacheTime: cacheConfig.dynamic.cacheTime,
    });
  };

  // Получение деталей заказа с предварительной загрузкой
  const useOrderDetails = (orderId: string, prefetch = false) => {
    const query = useQuery({
      queryKey: queryKeys.orders.detail(orderId),
      queryFn: () => ordersService.getOrderById(orderId),
      staleTime: cacheConfig.dynamic.staleTime,
      cacheTime: cacheConfig.dynamic.cacheTime,
      enabled: !!orderId,
    });

    // Предварительная загрузка связанных данных
    if (prefetch && query.data) {
      // Предзагружаем данные организаций если они не в кэше
      queryClient.prefetchQuery({
        queryKey: queryKeys.orders.organizations,
        queryFn: () => ordersService.getAvailableOrganizations(),
        staleTime: cacheConfig.static.staleTime,
      });
    }

    return query;
  };

  // Мутация создания заказа с оптимистичными обновлениями
  const useCreateOrder = () => {
    return useMutation({
      mutationFn: ordersService.createOrder,
      onMutate: async (newOrder) => {
        // Отменяем исходящие запросы
        await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });

        // Сохраняем предыдущие данные
        const previousOrders = queryClient.getQueryData(queryKeys.orders.lists());

        // Оптимистично обновляем кэш
        queryClient.setQueryData(queryKeys.orders.lists(), (old: any) => {
          if (!old) return old;
          
          const optimisticOrder = {
            ...newOrder,
            id: `temp-${Date.now()}`,
            status: 'draft',
            createdAt: new Date().toISOString(),
          };

          return {
            ...old,
            data: [optimisticOrder, ...old.data],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1,
            },
          };
        });

        return { previousOrders };
      },
      onError: (err, newOrder, context) => {
        // Откатываем изменения при ошибке
        if (context?.previousOrders) {
          queryClient.setQueryData(queryKeys.orders.lists(), context.previousOrders);
        }
        GlobalErrorHandler.handleError(err, 'Create Order');
      },
      onSuccess: (data) => {
        // Инвалидируем и обновляем кэш
        cacheUtils.invalidateOrders(queryClient);
        GlobalErrorHandler.showSuccess(`Заказ ${data.orderNumber} создан успешно`);
      },
      onSettled: () => {
        // Обновляем данные в любом случае
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      },
    });
  };

  // Мутация обновления заказа
  const useUpdateOrder = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: any }) => 
        ordersService.updateOrder(id, data),
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(id) });
        
        const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(id));
        
        // Оптимистично обновляем детали заказа
        queryClient.setQueryData(queryKeys.orders.detail(id), (old: any) => ({
          ...old,
          ...data,
          updatedAt: new Date().toISOString(),
        }));

        return { previousOrder };
      },
      onError: (err, { id }, context) => {
        if (context?.previousOrder) {
          queryClient.setQueryData(queryKeys.orders.detail(id), context.previousOrder);
        }
        GlobalErrorHandler.handleError(err, 'Update Order');
      },
      onSuccess: (data) => {
        cacheUtils.invalidateOrders(queryClient, data.id);
        GlobalErrorHandler.showSuccess(`Заказ ${data.orderNumber} обновлен`);
      },
    });
  };

  // Мутация изменения статуса заказа
  const useUpdateOrderStatus = () => {
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) =>
        ordersService.updateOrderStatus(id, status as any),
      onSuccess: (data) => {
        cacheUtils.invalidateOrders(queryClient, data.id);
        GlobalErrorHandler.showSuccess(`Статус заказа ${data.orderNumber} изменен`);
      },
      onError: (err) => {
        GlobalErrorHandler.handleError(err, 'Update Order Status');
      },
    });
  };

  return {
    useOrdersList,
    useInfiniteOrders,
    useOrderDetails,
    useCreateOrder,
    useUpdateOrder,
    useUpdateOrderStatus,
  };
};

// Оптимизированные хуки для литературы
export const useOptimizedLiterature = () => {
  const queryClient = useQueryClient();

  const useLiteratureList = (filters: any = {}, options: PaginationParams = {}) => {
    return useQuery({
      queryKey: queryKeys.literature.list({ ...filters, ...options }),
      queryFn: async () => {
        const { literatureService } = await import('../services/literatureService');
        return literatureService.getLiterature(filters, options.page, options.limit);
      },
      staleTime: cacheConfig.static.staleTime,
      cacheTime: cacheConfig.static.cacheTime,
      keepPreviousData: true,
    });
  };

  const useLiteratureDetails = (literatureId: string) => {
    return useQuery({
      queryKey: queryKeys.literature.detail(literatureId),
      queryFn: async () => {
        const { literatureService } = await import('../services/literatureService');
        return literatureService.getLiteratureById(literatureId);
      },
      staleTime: cacheConfig.static.staleTime,
      cacheTime: cacheConfig.static.cacheTime,
      enabled: !!literatureId,
    });
  };

  const useLiteratureInventory = (literatureId: string) => {
    return useQuery({
      queryKey: queryKeys.literature.inventory(literatureId),
      queryFn: async () => {
        const { literatureService } = await import('../services/literatureService');
        return literatureService.getInventory(literatureId);
      },
      staleTime: cacheConfig.dynamic.staleTime,
      cacheTime: cacheConfig.dynamic.cacheTime,
      enabled: !!literatureId,
    });
  };

  return {
    useLiteratureList,
    useLiteratureDetails,
    useLiteratureInventory,
  };
};

// Оптимизированные хуки для аутентификации
export const useOptimizedAuth = () => {
  const queryClient = useQueryClient();

  const useProfile = () => {
    return useQuery({
      queryKey: queryKeys.auth.profile,
      queryFn: () => authService.getProfile(),
      staleTime: cacheConfig.user.staleTime,
      cacheTime: cacheConfig.user.cacheTime,
      retry: false, // Не повторяем запросы профиля при ошибках
    });
  };

  const useLogout = () => {
    return useMutation({
      mutationFn: authService.logout,
      onSuccess: () => {
        // Очищаем весь кэш при выходе
        cacheUtils.clearAll(queryClient);
        GlobalErrorHandler.showSuccess('Вы успешно вышли из системы');
      },
    });
  };

  return {
    useProfile,
    useLogout,
  };
};

// Хук для предварительной загрузки данных
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchOrdersList = (filters: any = {}) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.orders.list(filters),
      queryFn: () => ordersService.getOrders(filters),
      staleTime: cacheConfig.dynamic.staleTime,
    });
  };

  const prefetchLiteratureList = (filters: any = {}) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.literature.list(filters),
      queryFn: async () => {
        const { literatureService } = await import('../services/literatureService');
        return literatureService.getLiterature(filters);
      },
      staleTime: cacheConfig.static.staleTime,
    });
  };

  return {
    prefetchOrdersList,
    prefetchLiteratureList,
  };
};

// Хук для мониторинга производительности запросов
export const useQueryPerformance = () => {
  const queryClient = useQueryClient();

  const getQueryStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      cacheSize: queries.reduce((size, query) => {
        const data = query.state.data;
        return size + (data ? JSON.stringify(data).length : 0);
      }, 0),
    };
  };

  const clearStaleQueries = () => {
    const cache = queryClient.getQueryCache();
    const staleQueries = cache.getAll().filter(q => q.isStale());
    staleQueries.forEach(query => {
      queryClient.removeQueries({ queryKey: query.queryKey });
    });
    return staleQueries.length;
  };

  return {
    getQueryStats,
    clearStaleQueries,
  };
};