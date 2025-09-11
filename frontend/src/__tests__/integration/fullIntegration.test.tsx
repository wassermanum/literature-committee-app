import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import App from '@/App';
import httpClient from '@/services/httpClient';
import { authService } from '@/services/authService';

// Мокаем все внешние зависимости
vi.mock('../../services/httpClient');
vi.mock('../../services/authService');

const mockedHttpClient = httpClient as any;
const mockedAuthService = authService as any;

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

// Создаем тестовую обертку
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const theme = createTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Full Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('Application Initialization', () => {
    it('should render login page when not authenticated', async () => {
      // Мокаем отсутствие токена
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Должна отобразиться страница входа
      await waitFor(() => {
        expect(screen.getByText(/вход/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication flow', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'group',
      };

      const mockAuthResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
      };

      // Мокаем успешный логин
      mockedAuthService.login.mockResolvedValue(mockAuthResponse);
      mockedAuthService.getStoredUser.mockReturnValue(null);
      mockedAuthService.getStoredToken.mockReturnValue(null);

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Находим форму входа
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/пароль/i);
      const loginButton = screen.getByRole('button', { name: /войти/i });

      // Заполняем форму
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Проверяем, что вызвался сервис аутентификации
      await waitFor(() => {
        expect(mockedAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and handle React errors', () => {
      // Компонент, который выбрасывает ошибку
      const ErrorComponent = () => {
        throw new Error('Test React error');
      };

      const TestAppWithError = () => (
        <TestWrapper>
          <ErrorComponent />
        </TestWrapper>
      );

      render(<TestAppWithError />);

      // Должна отобразиться страница ошибки
      expect(screen.getByText(/произошла ошибка/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /перезагрузить/i })).toBeInTheDocument();
    });
  });

  describe('HTTP Client Integration', () => {
    it('should handle API requests with proper error handling', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockedHttpClient.get.mockRejectedValue(mockError);

      // Создаем компонент, который делает API запрос
      const TestApiComponent = () => {
        const [error, setError] = React.useState<string | null>(null);

        const handleApiCall = async () => {
          try {
            await httpClient.get('/test-endpoint');
          } catch (err) {
            setError('API Error occurred');
          }
        };

        return (
          <div>
            <button onClick={handleApiCall}>Make API Call</button>
            {error && <div data-testid="error-message">{error}</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestApiComponent />
        </TestWrapper>
      );

      const apiButton = screen.getByRole('button', { name: /make api call/i });
      fireEvent.click(apiButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('API Error occurred');
      });
    });

    it('should handle successful API requests', async () => {
      const mockData = { id: 1, name: 'Test Item' };
      mockedHttpClient.get.mockResolvedValue({ data: mockData });

      const TestApiComponent = () => {
        const [data, setData] = React.useState<any>(null);

        const handleApiCall = async () => {
          try {
            const response = await httpClient.get('/test-endpoint');
            setData(response.data);
          } catch (err) {
            console.error('API Error:', err);
          }
        };

        return (
          <div>
            <button onClick={handleApiCall}>Make API Call</button>
            {data && <div data-testid="success-data">{data.name}</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestApiComponent />
        </TestWrapper>
      );

      const apiButton = screen.getByRole('button', { name: /make api call/i });
      fireEvent.click(apiButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-data')).toHaveTextContent('Test Item');
      });
    });
  });

  describe('Loading States Integration', () => {
    it('should show loading states during API calls', async () => {
      // Создаем промис, который мы можем контролировать
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockedHttpClient.get.mockReturnValue(controlledPromise);

      const TestLoadingComponent = () => {
        const [loading, setLoading] = React.useState(false);
        const [data, setData] = React.useState<any>(null);

        const handleApiCall = async () => {
          setLoading(true);
          try {
            const response = await httpClient.get('/test-endpoint');
            setData(response.data);
          } finally {
            setLoading(false);
          }
        };

        return (
          <div>
            <button onClick={handleApiCall}>Load Data</button>
            {loading && <div data-testid="loading">Loading...</div>}
            {data && <div data-testid="data">Data loaded</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestLoadingComponent />
        </TestWrapper>
      );

      const loadButton = screen.getByRole('button', { name: /load data/i });
      fireEvent.click(loadButton);

      // Проверяем, что показывается состояние загрузки
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Завершаем запрос
      resolvePromise!({ data: { success: true } });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('data')).toBeInTheDocument();
      });
    });
  });

  describe('Token Refresh Integration', () => {
    it('should handle token refresh on 401 errors', async () => {
      const mockRefreshResponse = {
        data: { accessToken: 'new-access-token' },
      };

      // Первый запрос возвращает 401
      const unauthorizedError = {
        response: { status: 401 },
        config: { headers: {}, _retry: false },
      };

      // Второй запрос (после refresh) успешен
      const successResponse = { data: { success: true } };

      mockedHttpClient.get
        .mockRejectedValueOnce(unauthorizedError)
        .mockResolvedValueOnce(successResponse);

      mockedHttpClient.post.mockResolvedValue(mockRefreshResponse);

      localStorageMock.getItem.mockReturnValue('old-refresh-token');

      const TestTokenComponent = () => {
        const [result, setResult] = React.useState<string>('');

        const handleApiCall = async () => {
          try {
            await httpClient.get('/protected-endpoint');
            setResult('Success');
          } catch (err) {
            setResult('Error');
          }
        };

        return (
          <div>
            <button onClick={handleApiCall}>Call Protected API</button>
            <div data-testid="result">{result}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestTokenComponent />
        </TestWrapper>
      );

      const apiButton = screen.getByRole('button', { name: /call protected api/i });
      fireEvent.click(apiButton);

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('Success');
      });

      // Проверяем, что был вызван refresh
      expect(mockedHttpClient.post).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
    });
  });

  describe('Notification Integration', () => {
    it('should show notifications for user actions', async () => {
      const mockData = { id: 1, message: 'Success' };
      mockedHttpClient.post.mockResolvedValue({ data: mockData });

      const TestNotificationComponent = () => {
        const [message, setMessage] = React.useState<string>('');

        const handleAction = async () => {
          try {
            await httpClient.post('/action-endpoint', {});
            setMessage('Action completed successfully');
          } catch (err) {
            setMessage('Action failed');
          }
        };

        return (
          <div>
            <button onClick={handleAction}>Perform Action</button>
            {message && <div data-testid="notification">{message}</div>}
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestNotificationComponent />
        </TestWrapper>
      );

      const actionButton = screen.getByRole('button', { name: /perform action/i });
      fireEvent.click(actionButton);

      await waitFor(() => {
        expect(screen.getByTestId('notification')).toHaveTextContent('Action completed successfully');
      });
    });
  });
});