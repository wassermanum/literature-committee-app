import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import GlobalErrorHandler from '@/utils/errorHandler';

// Конфигурация кэширования для различных типов данных
export const cacheConfig = {
  // Статические данные (каталог литературы, организации)
  static: {
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 30 * 60 * 1000, // 30 минут
  },
  
  // Динамические данные (заказы, остатки)
  dynamic: {
    staleTime: 30 * 1000, // 30 секунд
    cacheTime: 5 * 60 * 1000, // 5 минут
  },
  
  // Пользовательские данные
  user: {
    staleTime: 10 * 60 * 1000, // 10 минут
    cacheTime: 60 * 60 * 1000, // 1 час
  },
  
  // Отчеты
  reports: {
    staleTime: 2 * 60 * 1000, // 2 минуты
    cacheTime: 10 * 60 * 1000, // 10 минут
  }
};

// Ключи для кэширования
export const queryKeys = {
  // Аутентификация
  auth: {
    profile: ['auth', 'profile'] as const,
    permissions: ['auth', 'permissions'] as const,
  },
  
  // Заказы
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    organizations: ['orders', 'organizations'] as const,
  },
  
  // Литература
  literature: {
    all: ['literature'] as const,
    lists: () => [...queryKeys.literature.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.literature.lists(), filters] as const,
    details: () => [...queryKeys.literature.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.literature.details(), id] as const,
    inventory: (id: string) => [...queryKeys.literature.detail(id), 'inventory'] as const,
  },
  
  // Отчеты
  reports: {
    all: ['reports'] as const,
    movement: (params: any) => [...queryKeys.reports.all, 'movement', params] as const,
    financial: (params: any) => [...queryKeys.reports.all, 'financial', params] as const,
    inventory: (params: any) => [...queryKeys.reports.all, 'inventory', params] as const,
  },
  
  // Администрирование
  admin: {
    users: {
      all: ['admin', 'users'] as const,
      lists: () => [...queryKeys.admin.users.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.admin.users.lists(), filters] as const,
      detail: (id: string) => [...queryKeys.admin.users.all, 'detail', id] as const,
    },
    organizations: {
      all: ['admin', 'organizations'] as const,
      lists: () => [...queryKeys.admin.organizations.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.admin.organizations.lists(), filters] as const,
      detail: (id: string) => [...queryKeys.admin.organizations.all, 'detail', id] as const,
    },
  },
};

// Создание Query Client с оптимизированными настройками
export const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Логируем ошибки кэша
        console.error('Query Cache Error:', error, 'Query:', query);
        
        // Показываем ошибку пользователю только для интерактивных запросов
        if (query.meta?.showErrorToast !== false) {
          GlobalErrorHandler.handleError(error, 'Query Cache');
        }
      },
    }),
    
    mutationCache: new MutationCache({
      onError: (error, variables, _context, mutation) => {
        console.error('Mutation Cache Error:', error, 'Variables:', variables);
        
        // Показываем ошибку пользователю для всех мутаций
        if (mutation.meta?.showErrorToast !== false) {
          GlobalErrorHandler.handleError(error, 'Mutation Cache');
        }
      },
    }),
    
    defaultOptions: {
      queries: {
        // Базовые настройки для всех запросов
        staleTime: cacheConfig.dynamic.staleTime,
        cacheTime: cacheConfig.dynamic.cacheTime,
        retry: (failureCount, error: any) => {
          // Не повторяем запросы для ошибок аутентификации
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            return false;
          }
          // Максимум 2 повтора для других ошибок
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      
      mutations: {
        retry: false, // Не повторяем мутации автоматически
        onError: (error) => {
          console.error('Mutation error:', error);
        },
      },
    },
  });
};

// Утилиты для инвалидации кэша
export const cacheUtils = {
  // Инвалидация данных заказов
  invalidateOrders: (queryClient: QueryClient, orderId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    if (orderId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    }
  },
  
  // Инвалидация данных литературы
  invalidateLiterature: (queryClient: QueryClient, literatureId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.literature.all });
    if (literatureId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.literature.detail(literatureId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.literature.inventory(literatureId) });
    }
  },
  
  // Инвалидация пользовательских данных
  invalidateUsers: (queryClient: QueryClient, userId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.detail(userId) });
    }
  },
  
  // Инвалидация отчетов
  invalidateReports: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  },
  
  // Очистка всего кэша
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear();
  },
  
  // Предварительная загрузка данных
  prefetchOrderDetails: (queryClient: QueryClient, orderId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.orders.detail(orderId),
      queryFn: () => import('../services/ordersService').then(s => s.ordersService.getOrderById(orderId)),
      staleTime: cacheConfig.dynamic.staleTime,
    });
  },
  
  prefetchLiteratureDetails: (queryClient: QueryClient, literatureId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.literature.detail(literatureId),
      queryFn: () => import('../services/literatureService').then(s => s.literatureService.getLiteratureById(literatureId)),
      staleTime: cacheConfig.static.staleTime,
    });
  },
};

// Хук для работы с кэшем
export const useQueryCache = () => {
  const queryClient = new QueryClient();
  
  return {
    queryClient,
    ...cacheUtils,
  };
};

export default createQueryClient;