import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useApi, useApiMutation, useFetch } from '@/hooks/useApi';
import httpClient from '@/services/httpClient';
import GlobalErrorHandler from '@/utils/errorHandler';

// Мокаем httpClient
vi.mock('../../services/httpClient');
const mockedHttpClient = httpClient as any;

// Мокаем GlobalErrorHandler
vi.mock('../../utils/errorHandler');
const mockedErrorHandler = GlobalErrorHandler as any;

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useApi Hook', () => {
    it('should handle successful API calls', async () => {
      const mockData = { id: 1, name: 'Test Item' };
      const mockResponse = { data: mockData };
      
      mockedHttpClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useApi());

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await act(async () => {
        const data = await result.current.execute(() => httpClient.get('/test'));
        expect(data).toEqual(mockData);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      mockedHttpClient.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        const data = await result.current.execute(() => httpClient.get('/test'));
        expect(data).toBe(null);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('Произошла ошибка при выполнении запроса');
      expect(mockedErrorHandler.handleError).toHaveBeenCalledWith(mockError);
    });

    it('should show success message when configured', async () => {
      const mockData = { success: true };
      const mockResponse = { data: mockData };
      
      mockedHttpClient.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.execute(
          () => httpClient.post('/test', {}),
          {
            showSuccessMessage: true,
            successMessage: 'Operation successful',
          }
        );
      });

      expect(mockedErrorHandler.showSuccess).toHaveBeenCalledWith('Operation successful');
    });

    it('should call onSuccess callback', async () => {
      const mockData = { id: 1 };
      const mockResponse = { data: mockData };
      const onSuccess = vi.fn();
      
      mockedHttpClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.execute(
          () => httpClient.get('/test'),
          { onSuccess }
        );
      });

      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });

    it('should call onError callback', async () => {
      const mockError = new Error('API Error');
      const onError = vi.fn();
      
      mockedHttpClient.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.execute(
          () => httpClient.get('/test'),
          { onError }
        );
      });

      expect(onError).toHaveBeenCalledWith(mockError);
    });

    it('should reset state', async () => {
      const mockData = { id: 1 };
      const mockResponse = { data: mockData };
      
      mockedHttpClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useApi());

      // Выполняем запрос
      await act(async () => {
        await result.current.execute(() => httpClient.get('/test'));
      });

      expect(result.current.data).toEqual(mockData);

      // Сбрасываем состояние
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('useApiMutation Hook', () => {
    it('should handle mutations with success messages', async () => {
      const mockData = { id: 1, name: 'Created Item' };
      const mockResponse = { data: mockData };
      
      mockedHttpClient.post.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useApiMutation());

      await act(async () => {
        const data = await result.current.mutate(() => 
          httpClient.post('/items', { name: 'New Item' })
        );
        expect(data).toEqual(mockData);
      });

      expect(mockedErrorHandler.showSuccess).toHaveBeenCalledWith('Операция выполнена успешно');
    });

    it('should handle mutation errors', async () => {
      const mockError = new Error('Mutation Error');
      mockedHttpClient.post.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useApiMutation());

      await act(async () => {
        const data = await result.current.mutate(() => 
          httpClient.post('/items', { name: 'New Item' })
        );
        expect(data).toBe(null);
      });

      expect(result.current.error).toBe('Произошла ошибка при выполнении запроса');
      expect(mockedErrorHandler.handleError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('useFetch Hook', () => {
    it('should fetch data successfully', async () => {
      const mockData = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      const mockResponse = { data: mockData };
      
      mockedHttpClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useFetch());

      await act(async () => {
        const data = await result.current.fetch(() => httpClient.get('/items'));
        expect(data).toEqual(mockData);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle fetch errors', async () => {
      const mockError = new Error('Fetch Error');
      mockedHttpClient.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useFetch());

      await act(async () => {
        const data = await result.current.fetch(() => httpClient.get('/items'));
        expect(data).toBe(null);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe('Произошла ошибка при выполнении запроса');
      expect(mockedErrorHandler.handleError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Loading States', () => {
    it('should manage loading state correctly', async () => {
      const mockData = { id: 1 };
      const mockResponse = { data: mockData };
      
      // Создаем промис, который мы можем контролировать
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockedHttpClient.get.mockReturnValueOnce(controlledPromise);

      const { result } = renderHook(() => useApi());

      // Начинаем запрос
      act(() => {
        result.current.execute(() => httpClient.get('/test'));
      });

      // Проверяем, что loading = true
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      // Завершаем запрос
      await act(async () => {
        resolvePromise!(mockResponse);
      });

      // Проверяем финальное состояние
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Suppression', () => {
    it('should not show error message when showErrorMessage is false', async () => {
      const mockError = new Error('API Error');
      mockedHttpClient.get.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useApi());

      await act(async () => {
        await result.current.execute(
          () => httpClient.get('/test'),
          { showErrorMessage: false }
        );
      });

      expect(mockedErrorHandler.handleError).not.toHaveBeenCalled();
    });
  });
});