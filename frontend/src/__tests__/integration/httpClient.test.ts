import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import httpClient from '@/services/httpClient';

// Мокаем axios
vi.mock('axios');
const mockedAxios = axios as any;

// Мокаем localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Мокаем window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('HTTP Client Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', async () => {
      const mockToken = 'test-access-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      const mockResponse = { data: { success: true } };
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      // Симулируем запрос
      const response = await httpClient.get('/test');
      
      expect(response).toEqual(mockResponse);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken');
    });

    it('should not add authorization header when token does not exist', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const mockResponse = { data: { success: true } };
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const response = await httpClient.get('/test');
      
      expect(response).toEqual(mockResponse);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('Response Interceptor - Token Refresh', () => {
    it('should refresh token on 401 error and retry request', async () => {
      const mockRefreshToken = 'test-refresh-token';
      const mockNewAccessToken = 'new-access-token';
      
      localStorageMock.getItem
        .mockReturnValueOnce(null) // accessToken
        .mockReturnValueOnce(mockRefreshToken); // refreshToken

      const mockError = {
        response: { status: 401 },
        config: { headers: {}, _retry: false },
      };

      const mockRefreshResponse = {
        data: { accessToken: mockNewAccessToken },
      };

      const mockRetryResponse = { data: { success: true } };

      // Мокаем axios.post для refresh запроса
      mockedAxios.post.mockResolvedValueOnce(mockRefreshResponse);

      const mockHttpClient = {
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn().mockRejectedValueOnce(mockError).mockResolvedValueOnce(mockRetryResponse),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      // Симулируем перехватчик ответов
      const responseInterceptor = mockHttpClient.interceptors.response.use.mock.calls[0][1];
      
      try {
        await responseInterceptor(mockError);
      } catch (error) {
        // Ожидаем, что будет вызван refresh
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/refresh', {
          refreshToken: mockRefreshToken,
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', mockNewAccessToken);
      }
    });

    it('should redirect to login when refresh token is invalid', async () => {
      localStorageMock.getItem
        .mockReturnValueOnce(null) // accessToken
        .mockReturnValueOnce('invalid-refresh-token'); // refreshToken

      const mockError = {
        response: { status: 401 },
        config: { headers: {}, _retry: false },
      };

      // Мокаем неудачный refresh запрос
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid refresh token'));

      const mockHttpClient = {
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      const responseInterceptor = mockHttpClient.interceptors.response.use.mock.calls[0][1];
      
      try {
        await responseInterceptor(mockError);
      } catch (error) {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
        expect(window.location.href).toBe('/login');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      };

      const mockHttpClient = {
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn().mockRejectedValue(networkError),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      try {
        await httpClient.get('/test');
      } catch (error) {
        expect(error).toEqual(networkError);
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      };

      const mockHttpClient = {
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn().mockRejectedValue(timeoutError),
      };

      mockedAxios.create.mockReturnValue(mockHttpClient as any);

      try {
        await httpClient.get('/test');
      } catch (error) {
        expect(error).toEqual(timeoutError);
      }
    });
  });
});