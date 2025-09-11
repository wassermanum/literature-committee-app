import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { LiteratureCatalog } from '../LiteratureCatalog';
import AuthContext from '@/contexts/AuthContext';
import { User, UserRole } from '@/types';
import { theme } from '@/theme';
import * as useLiteratureHook from '@/hooks/useLiterature';

// Мокаем хук useLiterature
jest.mock('../../../hooks/useLiterature');
const mockUseLiterature = useLiteratureHook.useLiterature as jest.MockedFunction<
  typeof useLiteratureHook.useLiterature
>;

// Мокаем компоненты для изоляции тестирования
jest.mock('../LiteratureItem', () => ({
  LiteratureItem: ({ literature, onEdit, onSelect }: any) => (
    <div data-testid={`literature-item-${literature.id}`}>
      <span>{literature.title}</span>
      {onEdit && (
        <button onClick={() => onEdit(literature.id)}>Edit</button>
      )}
      {onSelect && (
        <button onClick={() => onSelect(literature.id)}>Select</button>
      )}
    </div>
  ),
}));

jest.mock('../LiteratureFilters', () => ({
  LiteratureFilters: ({ onFiltersChange }: any) => (
    <div data-testid="literature-filters">
      <button onClick={() => onFiltersChange({ search: 'test' })}>
        Apply Filter
      </button>
    </div>
  ),
}));

jest.mock('../LiteratureForm', () => ({
  LiteratureForm: ({ open, onClose, onSuccess }: any) =>
    open ? (
      <div data-testid="literature-form">
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    ) : null,
}));

const mockLiterature = [
  {
    id: '1',
    title: 'Базовый текст АН',
    description: 'Основная литература',
    category: 'Базовая литература',
    price: 350,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    inventory: [],
    totalQuantity: 45,
    availableQuantity: 40,
  },
  {
    id: '2',
    title: 'Это работает',
    description: 'Истории выздоровления',
    category: 'Истории выздоровления',
    price: 280,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    inventory: [],
    totalQuantity: 23,
    availableQuantity: 20,
  },
];

const mockAdminUser: User = {
  id: '1',
  email: 'admin@test.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.ADMIN,
  organizationId: 'org1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockGroupUser: User = {
  id: '2',
  email: 'group@test.com',
  firstName: 'Group',
  lastName: 'User',
  role: UserRole.GROUP,
  organizationId: 'org2',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAuthContextValue = {
  user: mockAdminUser,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
};

const renderWithProviders = (
  component: React.ReactElement,
  user: User = mockAdminUser
) => {
  return render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={{ ...mockAuthContextValue, user }}>
        {component}
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

describe('LiteratureCatalog', () => {
  const mockUpdateFilters = jest.fn();
  const mockUpdatePage = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseLiterature.mockReturnValue({
      literature: mockLiterature,
      total: 2,
      page: 1,
      limit: 20,
      filters: {},
      categories: ['Базовая литература', 'Истории выздоровления'],
      loading: false,
      error: null,
      createLiterature: jest.fn(),
      updateLiterature: jest.fn(),
      deleteLiterature: jest.fn(),
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      updateLimit: jest.fn(),
      refetch: mockRefetch,
    });
  });

  it('renders catalog title and literature items', () => {
    renderWithProviders(<LiteratureCatalog />);

    expect(screen.getByText('Каталог литературы')).toBeInTheDocument();
    expect(screen.getByTestId('literature-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('literature-item-2')).toBeInTheDocument();
    expect(screen.getByText('Базовый текст АН')).toBeInTheDocument();
    expect(screen.getByText('Это работает')).toBeInTheDocument();
  });

  it('shows add button for admin users', () => {
    renderWithProviders(<LiteratureCatalog />);

    const addButton = screen.getByRole('button');
    expect(addButton).toBeInTheDocument();
  });

  it('does not show add button for non-admin users', () => {
    renderWithProviders(<LiteratureCatalog />, mockGroupUser);

    // Проверяем, что кнопка добавления отсутствует
    const buttons = screen.getAllByRole('button');
    const addButton = buttons.find(button => 
      button.getAttribute('aria-label')?.includes('add') ||
      button.textContent?.includes('Добавить')
    );
    expect(addButton).toBeUndefined();
  });

  it('opens form when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LiteratureCatalog />);

    const addButton = screen.getByRole('button');
    await user.click(addButton);

    expect(screen.getByTestId('literature-form')).toBeInTheDocument();
  });

  it('handles filters change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LiteratureCatalog />);

    const filterButton = screen.getByText('Apply Filter');
    await user.click(filterButton);

    expect(mockUpdateFilters).toHaveBeenCalledWith({ search: 'test' });
  });

  it('handles item selection in selectable mode', async () => {
    const mockOnItemSelect = jest.fn();
    const user = userEvent.setup();
    
    renderWithProviders(
      <LiteratureCatalog selectable onItemSelect={mockOnItemSelect} />
    );

    const selectButton = screen.getAllByText('Select')[0];
    await user.click(selectButton!);

    expect(mockOnItemSelect).toHaveBeenCalledWith('1');
  });

  it('handles item editing for admin users', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LiteratureCatalog />);

    const editButton = screen.getAllByText('Edit')[0];
    await user.click(editButton!);

    expect(screen.getByTestId('literature-form')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseLiterature.mockReturnValue({
      literature: [],
      total: 0,
      page: 1,
      limit: 20,
      filters: {},
      categories: [],
      loading: true,
      error: null,
      createLiterature: jest.fn(),
      updateLiterature: jest.fn(),
      deleteLiterature: jest.fn(),
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      updateLimit: jest.fn(),
      refetch: mockRefetch,
    });

    renderWithProviders(<LiteratureCatalog />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseLiterature.mockReturnValue({
      literature: [],
      total: 0,
      page: 1,
      limit: 20,
      filters: {},
      categories: [],
      loading: false,
      error: 'Test error message',
      createLiterature: jest.fn(),
      updateLiterature: jest.fn(),
      deleteLiterature: jest.fn(),
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      updateLimit: jest.fn(),
      refetch: mockRefetch,
    });

    renderWithProviders(<LiteratureCatalog />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows empty state when no literature found', () => {
    mockUseLiterature.mockReturnValue({
      literature: [],
      total: 0,
      page: 1,
      limit: 20,
      filters: {},
      categories: [],
      loading: false,
      error: null,
      createLiterature: jest.fn(),
      updateLiterature: jest.fn(),
      deleteLiterature: jest.fn(),
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      updateLimit: jest.fn(),
      refetch: mockRefetch,
    });

    renderWithProviders(<LiteratureCatalog />);

    expect(screen.getByText('Литература не найдена')).toBeInTheDocument();
    expect(screen.getByText('Попробуйте изменить параметры поиска')).toBeInTheDocument();
  });

  it('shows pagination when there are multiple pages', () => {
    mockUseLiterature.mockReturnValue({
      literature: mockLiterature,
      total: 50, // Больше чем limit (20)
      page: 1,
      limit: 20,
      filters: {},
      categories: [],
      loading: false,
      error: null,
      createLiterature: jest.fn(),
      updateLiterature: jest.fn(),
      deleteLiterature: jest.fn(),
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      updateLimit: jest.fn(),
      refetch: mockRefetch,
    });

    renderWithProviders(<LiteratureCatalog />);

    // Проверяем наличие пагинации (3 страницы: 50/20 = 2.5 -> 3)
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('handles page change', async () => {
    const user = userEvent.setup();
    
    mockUseLiterature.mockReturnValue({
      literature: mockLiterature,
      total: 50,
      page: 1,
      limit: 20,
      filters: {},
      categories: [],
      loading: false,
      error: null,
      createLiterature: jest.fn(),
      updateLiterature: jest.fn(),
      deleteLiterature: jest.fn(),
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      updateLimit: jest.fn(),
      refetch: mockRefetch,
    });

    renderWithProviders(<LiteratureCatalog />);

    const page2Button = screen.getByRole('button', { name: 'Go to page 2' });
    await user.click(page2Button);

    expect(mockUpdatePage).toHaveBeenCalledWith(2);
  });

  it('closes form and refetches data on successful save', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LiteratureCatalog />);

    // Открываем форму
    const addButton = screen.getByRole('button');
    await user.click(addButton);

    // Сохраняем
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockRefetch).toHaveBeenCalled();
    expect(screen.queryByTestId('literature-form')).not.toBeInTheDocument();
  });

  it('closes form without refetch on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LiteratureCatalog />);

    // Открываем форму
    const addButton = screen.getByRole('button');
    await user.click(addButton);

    // Закрываем
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(mockRefetch).not.toHaveBeenCalled();
    expect(screen.queryByTestId('literature-form')).not.toBeInTheDocument();
  });
});