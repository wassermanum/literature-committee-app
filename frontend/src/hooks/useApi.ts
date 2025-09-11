import { useState, useCallback } from 'react';
import { AxiosResponse } from 'axios';
import httpClient from '@/services/httpClient';
import GlobalErrorHandler from '@/utils/errorHandler';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  showSuccessMessage?: boolean;
  successMessage?: string;
  showErrorMessage?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      apiCall: () => Promise<AxiosResponse<T>>,
      options: UseApiOptions = {}
    ): Promise<T | null> => {
      const {
        showSuccessMessage = false,
        successMessage = 'Операция выполнена успешно',
        showErrorMessage = true,
        onSuccess,
        onError,
      } = options;

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiCall();
        const data = response.data;

        setState({
          data,
          loading: false,
          error: null,
        });

        if (showSuccessMessage) {
          GlobalErrorHandler.showSuccess(successMessage);
        }

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error) {
        const errorMessage = 'Произошла ошибка при выполнении запроса';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        if (showErrorMessage) {
          GlobalErrorHandler.handleError(error);
        }

        if (onError) {
          onError(error);
        }

        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Специализированные хуки для CRUD операций
export function useApiMutation<T = any>() {
  const { execute, loading, error } = useApi<T>();

  const mutate = useCallback(
    async (
      apiCall: () => Promise<AxiosResponse<T>>,
      options: UseApiOptions = {}
    ) => {
      return execute(apiCall, {
        showSuccessMessage: true,
        ...options,
      });
    },
    [execute]
  );

  return {
    mutate,
    loading,
    error,
  };
}

// Хук для создания ресурсов
export function useCreate<T = any>() {
  return useApiMutation<T>();
}

// Хук для обновления ресурсов
export function useUpdate<T = any>() {
  return useApiMutation<T>();
}

// Хук для удаления ресурсов
export function useDelete() {
  return useApiMutation<void>();
}

// Хук для получения списка ресурсов
export function useFetch<T = any>() {
  const { execute, data, loading, error, reset } = useApi<T>();

  const fetch = useCallback(
    async (apiCall: () => Promise<AxiosResponse<T>>) => {
      return execute(apiCall, { showErrorMessage: true });
    },
    [execute]
  );

  return {
    fetch,
    data,
    loading,
    error,
    reset,
  };
}

// Хук для работы с пагинацией
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function usePaginatedFetch<T = any>() {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const { execute, data, loading, error, reset } = useApi<PaginatedResponse<T>>();

  const fetchPage = useCallback(
    async (
      apiCall: (page: number, limit: number) => Promise<AxiosResponse<PaginatedResponse<T>>>,
      page: number = 1,
      limit: number = 10
    ) => {
      const result = await execute(() => apiCall(page, limit));
      
      if (result) {
        setPagination({
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        });
      }
      
      return result;
    },
    [execute]
  );

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      return fetchPage(
        (page, limit) => httpClient.get(`?page=${page}&limit=${limit}`),
        pagination.page + 1,
        pagination.limit
      );
    }
    return Promise.resolve();
  }, [fetchPage, pagination]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      return fetchPage(
        (page, limit) => httpClient.get(`?page=${page}&limit=${limit}`),
        pagination.page - 1,
        pagination.limit
      );
    }
    return Promise.resolve();
  }, [fetchPage, pagination]);

  return {
    fetchPage,
    nextPage,
    prevPage,
    data: data?.data || [],
    pagination,
    loading,
    error,
    reset,
  };
}

export default useApi;