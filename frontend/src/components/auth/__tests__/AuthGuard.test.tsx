import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

import { AuthGuard, RoleGuard } from '../AuthGuard';
import { AuthProvider } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/auth';
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

const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/'] 
}) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.GROUP,
  organizationId: 'org1',
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('AuthGuard', () => {
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

  it('shows loading spinner while checking authentication', () => {
    // Мокаем состояние загрузки
    mockedAuthService.getStoredUser.mockReturnValue(null);
    mockedAuthService.getStoredToken.mockReturnValue(null);

    render(
      <TestWrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    );

    expect(screen.getByText('Проверка аутентификации...')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', async () => {
    mockedAuthService.getStoredUser.mockReturnValue(mockUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    );

    // Ждем, пока загрузка завершится и контент отобразится
    await screen.findByText('Protected Content');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows access denied when user role is not allowed', async () => {
    const adminUser = { ...mockUser, role: UserRole.ADMIN };
    mockedAuthService.getStoredUser.mockReturnValue(adminUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(adminUser);

    render(
      <TestWrapper>
        <AuthGuard requiredRoles={[UserRole.GROUP]}>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    );

    await screen.findByText('Доступ запрещен');
    expect(screen.getByText('Доступ запрещен')).toBeInTheDocument();
    expect(screen.getByText('Ваша роль: Администратор')).toBeInTheDocument();
    expect(screen.getByText('Требуемые роли: Группа')).toBeInTheDocument();
  });

  it('allows access when user has required role', async () => {
    mockedAuthService.getStoredUser.mockReturnValue(mockUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <AuthGuard requiredRoles={[UserRole.GROUP, UserRole.LOCALITY]}>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    );

    await screen.findByText('Protected Content');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('allows access when no roles are required', async () => {
    mockedAuthService.getStoredUser.mockReturnValue(mockUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </TestWrapper>
    );

    await screen.findByText('Protected Content');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

describe('RoleGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('renders children when user has allowed role', async () => {
    mockedAuthService.getStoredUser.mockReturnValue(mockUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <AuthProvider>
          <RoleGuard allowedRoles={[UserRole.GROUP]}>
            <div>Role Protected Content</div>
          </RoleGuard>
        </AuthProvider>
      </TestWrapper>
    );

    await screen.findByText('Role Protected Content');
    expect(screen.getByText('Role Protected Content')).toBeInTheDocument();
  });

  it('shows default message when user role is not allowed', async () => {
    const adminUser = { ...mockUser, role: UserRole.ADMIN };
    mockedAuthService.getStoredUser.mockReturnValue(adminUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(adminUser);

    render(
      <TestWrapper>
        <AuthProvider>
          <RoleGuard allowedRoles={[UserRole.GROUP]}>
            <div>Role Protected Content</div>
          </RoleGuard>
        </AuthProvider>
      </TestWrapper>
    );

    await screen.findByText('Эта функция недоступна для вашей роли');
    expect(screen.getByText('Эта функция недоступна для вашей роли')).toBeInTheDocument();
  });

  it('shows custom fallback component when user role is not allowed', async () => {
    const adminUser = { ...mockUser, role: UserRole.ADMIN };
    mockedAuthService.getStoredUser.mockReturnValue(adminUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(adminUser);

    render(
      <TestWrapper>
        <AuthProvider>
          <RoleGuard 
            allowedRoles={[UserRole.GROUP]}
            fallbackComponent={<div>Custom Fallback</div>}
          >
            <div>Role Protected Content</div>
          </RoleGuard>
        </AuthProvider>
      </TestWrapper>
    );

    await screen.findByText('Custom Fallback');
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });
});