import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

import { OrderList } from '../OrderList';
import { AuthProvider } from '@/contexts/AuthContext';
import { Order, OrderStatus } from '@/types/orders';
import { UserRole } from '@/types/auth';
import theme from '@/theme/theme';
import { authService } from '@/services/authService';

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

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    fromOrganizationId: 'org1',
    toOrganizationId: 'org2',
    status: OrderStatus.DRAFT,
    totalAmount: 1000,
    notes: 'Test order',
    isEditable: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    items: [
      {
        id: 'item1',
        orderId: '1',
        literatureId: 'lit1',
        quantity: 2,
        unitPrice: 500,
        totalPrice: 1000,
      },
    ],
    fromOrganization: {
      id: 'org1',
      name: 'Test Organization 1',
      type: 'group',
      address: 'Test Address 1',
      contactPerson: 'John Doe',
      phone: '+7 123 456 7890',
      email: 'org1@test.com',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
    toOrganization: {
      id: 'org2',
      name: 'Test Organization 2',
      type: 'locality',
      address: 'Test Address 2',
      contactPerson: 'Jane Smith',
      phone: '+7 123 456 7891',
      email: 'org2@test.com',
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    },
  },
];

const defaultProps = {
  orders: mockOrders,
  loading: false,
  total: 1,
  page: 0,
  limit: 20,
  onPageChange: jest.fn(),
  onLimitChange: jest.fn(),
  onViewOrder: jest.fn(),
  onEditOrder: jest.fn(),
  onDeleteOrder: jest.fn(),
  onChangeStatus: jest.fn(),
  onLockOrder: jest.fn(),
  onUnlockOrder: jest.fn(),
};

describe('OrderList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuthService.getStoredUser.mockReturnValue(mockUser);
    mockedAuthService.getStoredToken.mockReturnValue('valid-token');
    mockedAuthService.getProfile.mockResolvedValue(mockUser);
  });

  it('renders order list correctly', async () => {
    render(
      <TestWrapper>
        <OrderList {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Organization 1')).toBeInTheDocument();
    expect(screen.getByText('Test Organization 2')).toBeInTheDocument();
    expect(screen.getByText('1 000 ₽')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(
      <TestWrapper>
        <OrderList {...defaultProps} loading={true} />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no orders', async () => {
    render(
      <TestWrapper>
        <OrderList {...defaultProps} orders={[]} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Заказы не найдены')).toBeInTheDocument();
    });
  });

  it('calls onViewOrder when clicking on row', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <OrderList {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const row = screen.getByText('ORD-2024-001').closest('tr');
    await user.click(row!);

    expect(defaultProps.onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
  });

  it('opens context menu when clicking more button', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <OrderList {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const moreButton = screen.getByLabelText('more');
    await user.click(moreButton);

    expect(screen.getByText('Просмотр')).toBeInTheDocument();
  });

  it('shows edit option for editable orders', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <OrderList {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const moreButton = screen.getByLabelText('more');
    await user.click(moreButton);

    expect(screen.getByText('Редактировать')).toBeInTheDocument();
  });

  it('does not show edit option for non-editable orders', async () => {
    const user = userEvent.setup();
    const nonEditableOrders = [
      {
        ...mockOrders[0],
        isEditable: false,
        status: OrderStatus.IN_ASSEMBLY,
      },
    ];
    
    render(
      <TestWrapper>
        <OrderList {...defaultProps} orders={nonEditableOrders} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const moreButton = screen.getByLabelText('more');
    await user.click(moreButton);

    expect(screen.queryByText('Редактировать')).not.toBeInTheDocument();
  });

  it('shows lock icon for non-editable orders', async () => {
    const nonEditableOrders = [
      {
        ...mockOrders[0],
        isEditable: false,
      },
    ];
    
    render(
      <TestWrapper>
        <OrderList {...defaultProps} orders={nonEditableOrders} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    expect(screen.getByTitle('Заказ заблокирован для редактирования')).toBeInTheDocument();
  });

  it('handles pagination correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <OrderList {...defaultProps} total={100} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    // Проверяем, что пагинация отображается
    expect(screen.getByText('1-1 из 100')).toBeInTheDocument();
    
    // Тестируем изменение количества строк на странице
    const rowsPerPageSelect = screen.getByDisplayValue('20');
    await user.click(rowsPerPageSelect);
    
    const option50 = screen.getByText('50');
    await user.click(option50);
    
    expect(defaultProps.onLimitChange).toHaveBeenCalledWith(50);
  });

  it('calls appropriate handlers from context menu', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <OrderList {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    const moreButton = screen.getByLabelText('more');
    await user.click(moreButton);

    // Тестируем просмотр
    const viewButton = screen.getByText('Просмотр');
    await user.click(viewButton);
    expect(defaultProps.onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
  });

  it('formats currency correctly', async () => {
    render(
      <TestWrapper>
        <OrderList {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('1 000 ₽')).toBeInTheDocument();
    });
  });

  it('formats date correctly', async () => {
    render(
      <TestWrapper>
        <OrderList {...defaultProps} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('01.01.2024 00:00')).toBeInTheDocument();
    });
  });
});