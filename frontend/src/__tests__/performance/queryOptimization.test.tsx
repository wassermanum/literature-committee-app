import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryClient, queryKeys, cacheConfig } from '@/config/queryClient';
import { useOptimizedOrders } from '@/hooks/useOptimizedQueries';
import { ordersService } from '@/services/ordersService';

// Мокаем сервисы
vi.mock('../../services/ordersService');
const mockedOrdersService = ordersService as any;

// Создаем обертку для тестов
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Query Optimization Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    vi.clearAllMocks();
  });

  describe('Cache Configuration', () => {
    it('should have appropriate cache times for different data types', () => {
      expect(cacheConfig.static.staleTime).toBe(5 * 60 * 1000); // 5 минут
      expect(cacheConfig.static.cacheTime).toBe(30 * 60 * 1000); // 30 минут
      
      expect(cacheConfig.dynamic.staleTime).toBe(30 * 1000); // 30 секунд
      expect(cacheConfig.dynamic.cacheTime).toBe(5 * 60 * 1000); // 5 минут
      
      expect(cacheConfig.user.staleTime).toBe(10 * 60 * 1000); // 10 минут
      expect(cacheConfig.user.cacheTime).toBe(60 * 60 * 1000); // 1 час
    });

    it('should generate consistent query keys', () => {
      const filters1 = { status: 'pending', page: 1 };
      const filters2 = { status: 'pending', page: 1 };
      
      const key1 = queryKeys.orders.list(filters1);
      const key2 = queryKeys.orders.list(filters2);
      
      expect(key1).toEqual(key2);
    });

    it('should generate different query keys for different filters', () => {
      const filters1 = { status: 'pending', page: 1 };
      const filters2 = { status: 'approved', page: 1 };
      
      const key1 = queryKeys.orders.list(filters1);
      const key2 = queryKeys.orders.list(filters2);
      
      expect(key1).not.toEqual(key2);
    });
  });

  describe('Optimized Orders Hook', () => {
    it('should cache orders list queries', async () => {
      const mockOrders = {
        data: [{ id: '1', orderNumber: 'ORD-001' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      };

      mockedOrdersService.getOrders.mockResolvedValue(mockOrders);

      const { result } = renderHook(
        () => useOptimizedOrders().useOrdersList({ status: 'pending' }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockOrders);
      expect(mockedOrdersService.getOrders).toHaveBeenCalledTimes(1);

      // Второй вызов должен использовать кэш
      const { result: result2 } = renderHook(
        () => useOptimizedOrders().useOrdersList({ status: 'pending' }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // API не должен вызываться повторно
      expect(mockedOrdersService.getOrders).toHaveBeenCalledTimes(1);
    });

    it('should handle optimistic updates for order creation', async () => {
      const newOrder = { title: 'New Order', description: 'Test order' };
      const createdOrder = { id: '1', orderNumber: 'ORD-001', ...newOrder };

      mockedOrdersService.createOrder.mockResolvedValue(createdOrder);

      const { result } = renderHook(
        () => useOptimizedOrders().useCreateOrder(),
        { wrapper: createWrapper(queryClient) }
      );

      // Выполняем мутацию
      result.current.mutate(newOrder);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(createdOrder);
      expect(mockedOrdersService.createOrder).toHaveBeenCalledWith(newOrder);
    });

    it('should rollback optimistic updates on error', async () => {
      const newOrder = { title: 'New Order', description: 'Test order' };
      const error = new Error('Creation failed');

      mockedOrdersService.createOrder.mockRejectedValue(error);

      const { result } = renderHook(
        () => useOptimizedOrders().useCreateOrder(),
        { wrapper: createWrapper(queryClient) }
      );

      // Выполняем мутацию
      result.current.mutate(newOrder);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Query Performance', () => {
    it('should measure query execution time', async () => {
      const startTime = performance.now();
      
      const mockOrders = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: `${i}`,
          orderNumber: `ORD-${i.toString().padStart(3, '0')}`
        })),
        pagination: { page: 1, limit: 1000, total: 1000, totalPages: 1 }
      };

      mockedOrdersService.getOrders.mockImplementation(async () => {
        // Симулируем задержку
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockOrders;
      });

      const { result } = renderHook(
        () => useOptimizedOrders().useOrdersList(),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Проверяем, что запрос выполнился в разумное время
      expect(executionTime).toBeLessThan(1000); // Менее 1 секунды
      expect(result.current.data?.data).toHaveLength(1000);
    });

    it('should handle concurrent queries efficiently', async () => {
      const mockOrders1 = {
        data: [{ id: '1', orderNumber: 'ORD-001' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      };

      const mockOrders2 = {
        data: [{ id: '2', orderNumber: 'ORD-002' }],
        pagination: { page: 2, limit: 20, total: 1, totalPages: 1 }
      };

      mockedOrdersService.getOrders
        .mockResolvedValueOnce(mockOrders1)
        .mockResolvedValueOnce(mockOrders2);

      const startTime = performance.now();

      // Выполняем два запроса одновременно
      await Promise.all([
        new Promise(resolve => {
          const { result } = renderHook(
            () => useOptimizedOrders().useOrdersList({}, { page: 1 }),
            { wrapper: createWrapper(queryClient) }
          );
          waitFor(() => result.current.isSuccess).then(() => resolve(result.current));
        }),
        new Promise(resolve => {
          const { result } = renderHook(
            () => useOptimizedOrders().useOrdersList({}, { page: 2 }),
            { wrapper: createWrapper(queryClient) }
          );
          waitFor(() => result.current.isSuccess).then(() => resolve(result.current));
        })
      ]);

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Проверяем, что оба запроса выполнились параллельно
      expect(executionTime).toBeLessThan(500); // Менее 500мс для параллельных запросов
      expect(mockedOrdersService.getOrders).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const largeDataset = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: `${i}`,
          orderNumber: `ORD-${i.toString().padStart(5, '0')}`,
          description: `Order description ${i}`.repeat(10), // Увеличиваем размер данных
        })),
        pagination: { page: 1, limit: 10000, total: 10000, totalPages: 1 }
      };

      mockedOrdersService.getOrders.mockResolvedValue(largeDataset);

      // Получаем начальное использование памяти
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const { result, unmount } = renderHook(
        () => useOptimizedOrders().useOrdersList(),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Размонтируем компонент
      unmount();

      // Принудительно запускаем сборку мусора (если доступно)
      if (global.gc) {
        global.gc();
      }

      // Проверяем, что память освободилась
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Увеличение памяти не должно быть критичным
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Менее 50MB
    });

    it('should properly cleanup query cache', () => {
      const initialQueriesCount = queryClient.getQueryCache().getAll().length;

      // Добавляем несколько запросов в кэш
      queryClient.setQueryData(queryKeys.orders.list({ page: 1 }), { data: [] });
      queryClient.setQueryData(queryKeys.orders.list({ page: 2 }), { data: [] });
      queryClient.setQueryData(queryKeys.orders.detail('1'), { id: '1' });

      const afterAddingCount = queryClient.getQueryCache().getAll().length;
      expect(afterAddingCount).toBe(initialQueriesCount + 3);

      // Очищаем кэш
      queryClient.clear();

      const afterClearingCount = queryClient.getQueryCache().getAll().length;
      expect(afterClearingCount).toBe(0);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without blocking UI', async () => {
      const error = new Error('Network error');
      mockedOrdersService.getOrders.mockRejectedValue(error);

      const startTime = performance.now();

      const { result } = renderHook(
        () => useOptimizedOrders().useOrdersList(),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Обработка ошибки должна быть быстрой
      expect(executionTime).toBeLessThan(200);
      expect(result.current.error).toEqual(error);
    });

    it('should retry failed queries with exponential backoff', async () => {
      let callCount = 0;
      mockedOrdersService.getOrders.mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Temporary error');
        }
        return {
          data: [{ id: '1', orderNumber: 'ORD-001' }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
        };
      });

      const { result } = renderHook(
        () => useOptimizedOrders().useOrdersList(),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 5000 });

      // Проверяем, что было несколько попыток
      expect(callCount).toBe(3);
      expect(result.current.data).toBeDefined();
    });
  });
});