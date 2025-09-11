import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

import { UserProfile } from '../UserProfile';
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

// Мокаем date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => '01 января 2023'),
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

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Иван',
  lastName: 'Петров',
  role: UserRole.GROUP,
  organizationId: 'org1',
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('UserProfile', () => {
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

    // Настраиваем мок для аутентифицированного пользователя
    mockedAuthService.getStoredUser.mockReturnValue(mockUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(mockUser);
  });

  it('renders user profile correctly', async () => {
    render(
      <TestWrapper>
        <UserProfile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    expect(screen.getByText('Группа')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('org1')).toBeInTheDocument();
    expect(screen.getByText('Активен')).toBeInTheDocument();
    expect(screen.getByText('01 января 2023')).toBeInTheDocument();
  });

  it('renders compact version correctly', async () => {
    render(
      <TestWrapper>
        <UserProfile compact />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    expect(screen.getByText('Группа')).toBeInTheDocument();
    // В компактной версии не должно быть кнопки выхода
    expect(screen.queryByText('Выйти из системы')).not.toBeInTheDocument();
  });

  it('shows logout button by default', async () => {
    render(
      <TestWrapper>
        <UserProfile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Выйти из системы')).toBeInTheDocument();
    });
  });

  it('hides logout button when showLogoutButton is false', async () => {
    render(
      <TestWrapper>
        <UserProfile showLogoutButton={false} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    expect(screen.queryByText('Выйти из системы')).not.toBeInTheDocument();
  });

  it('opens logout confirmation dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserProfile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Выйти из системы')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Выйти из системы');
    await user.click(logoutButton);

    expect(screen.getByText('Подтверждение выхода')).toBeInTheDocument();
    expect(screen.getByText('Вы уверены, что хотите выйти из системы?')).toBeInTheDocument();
  });

  it('cancels logout when clicking cancel', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserProfile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Выйти из системы')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Выйти из системы');
    await user.click(logoutButton);

    const cancelButton = screen.getByText('Отмена');
    await user.click(cancelButton);

    expect(screen.queryByText('Подтверждение выхода')).not.toBeInTheDocument();
  });

  it('calls logout when confirming', async () => {
    const user = userEvent.setup();
    mockedAuthService.logout.mockResolvedValue();
    
    render(
      <TestWrapper>
        <UserProfile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Выйти из системы')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Выйти из системы');
    await user.click(logoutButton);

    const confirmButton = screen.getByText('Выйти');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockedAuthService.logout).toHaveBeenCalled();
    });
  });

  it('displays correct role names and colors', async () => {
    const roles = [
      { role: UserRole.ADMIN, name: 'Администратор' },
      { role: UserRole.REGION, name: 'Регион' },
      { role: UserRole.LOCALITY, name: 'Местность' },
      { role: UserRole.LOCAL_SUBCOMMITTEE, name: 'Местный подкомитет' },
      { role: UserRole.GROUP, name: 'Группа' },
    ];

    for (const { role, name } of roles) {
      const userWithRole = { ...mockUser, role };
      mockedAuthService.getStoredUser.mockReturnValue(userWithRole);
      mockedAuthService.getProfile.mockResolvedValue(userWithRole);

      const { unmount } = render(
        <TestWrapper>
          <UserProfile />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(name)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('displays correct initials', async () => {
    render(
      <TestWrapper>
        <UserProfile />
      </TestWrapper>
    );

    await waitFor(() => {
      // Проверяем, что аватар содержит инициалы ИП (Иван Петров)
      const avatar = screen.getByText('ИП');
      expect(avatar).toBeInTheDocument();
    });
  });

  it('returns null when user is not available', () => {
    mockedAuthService.getStoredUser.mockReturnValue(null);
    mockedAuthService.getStoredToken.mockReturnValue(null);

    const { container } = render(
      <TestWrapper>
        <UserProfile />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});