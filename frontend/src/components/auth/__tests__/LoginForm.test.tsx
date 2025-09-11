import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

import { LoginForm } from '../LoginForm';
import { AuthProvider } from '../../../contexts/AuthContext';
import theme from '../../../theme/theme';
import { authService } from '../../../services/authService';

// Мокаем authService
jest.mock('../../../services/authService');
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Мокаем react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Мокаем localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders login form correctly', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByText('Вход в систему')).toBeInTheDocument();
    expect(screen.getByText('Литературный комитет АН Сибирь')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /войти/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email обязателен для заполнения')).toBeInTheDocument();
      expect(screen.getByText('Пароль обязателен для заполнения')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger onBlur

    await waitFor(() => {
      expect(screen.getByText('Введите корректный email адрес')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText('Пароль');
    await user.type(passwordInput, '123');
    await user.tab(); // Trigger onBlur

    await waitFor(() => {
      expect(screen.getByText('Пароль должен содержать минимум 6 символов')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText('Пароль') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('toggle password visibility');

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockAuthData = {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'group' as any,
        organizationId: 'org1',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    mockedAuthService.login.mockResolvedValue(mockAuthData);
    mockedAuthService.storeAuthData.mockImplementation(() => {});

    const onSuccess = jest.fn();
    
    render(
      <TestWrapper>
        <LoginForm onSuccess={onSuccess} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Пароль');
    const submitButton = screen.getByRole('button', { name: /войти/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Неверные учетные данные';
    
    mockedAuthService.login.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Пароль');
    const submitButton = screen.getByRole('button', { name: /войти/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();
    
    // Создаем промис, который не резолвится сразу
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    
    mockedAuthService.login.mockReturnValue(loginPromise as any);

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Пароль');
    const submitButton = screen.getByRole('button', { name: /войти/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Проверяем, что кнопка заблокирована и показывает состояние загрузки
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Вход...')).toBeInTheDocument();

    // Резолвим промис
    resolveLogin!({
      user: { id: '1', firstName: 'Test' },
      accessToken: 'token',
      refreshToken: 'refresh',
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});