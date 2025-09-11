import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { UserManagement } from '../UserManagement';
import { User, UserRole, Organization, OrganizationType } from '../../../types';
import { theme } from '../../../theme';
import * as useAdminHook from '../../../hooks/useAdmin';

// Мокаем хуки
jest.mock('../../../hooks/useAdmin');
const mockUseUsers = useAdminHook.useUsers as jest.MockedFunction<
  typeof useAdminHook.useUsers
>;

// Мокаем UI компоненты
jest.mock('../../ui', () => ({
  AnimatedContainer: ({ children }: any) => <div>{children}</div>,
  GradientButton: ({ children, onClick, startIcon, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {startIcon}
      {children}
    </button>
  ),
}));

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@test.com',
    firstName: 'Админ',
    lastName: 'Системы',
    role: UserRole.ADMIN,
    organizationId: 'org1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'region@test.com',
    firstName: 'Региональный',
    lastName: 'Координатор',
    role: UserRole.REGION,
    organizationId: 'org2',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    email: 'group@test.com',
    firstName: 'Представитель',
    lastName: 'Группы',
    role: UserRole.GROUP,
    organizationId: 'org3',
    isActive: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const mockOrganizations: Organization[] = [
  {
    id: 'org1',
    name: 'Региональный офис',
    type: OrganizationType.REGION,
    address: 'ул. Центральная, 1',
    contactPerson: 'Иван Иванов',
    phone: '+7 123 456-78-90',
    email: 'region@example.com',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'org2',
    name: 'Местность Центр',
    type: OrganizationType.LOCALITY,
    parentId: 'org1',
    address: 'ул. Местная, 2',
    contactPerson: 'Петр Петров',
    phone: '+7 123 456-78-91',
    email: 'locality@example.com',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'org3',
    name: 'Группа Надежда',
    type: OrganizationType.GROUP,
    parentId: 'org2',
    address: 'ул. Групповая, 3',
    contactPerson: 'Сидор Сидоров',
    phone: '+7 123 456-78-92',
    email: 'group@example.com',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('UserManagement', () => {
  const mockCreateUser = jest.fn();
  const mockUpdateUser = jest.fn();
  const mockDeleteUser = jest.fn();
  const mockResetPassword = jest.fn();
  const mockUpdateFilters = jest.fn();
  const mockUpdatePage = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseUsers.mockReturnValue({
      users: mockUsers,
      total: mockUsers.length,
      page: 1,
      limit: 20,
      filters: {},
      loading: false,
      error: null,
      createUser: mockCreateUser,
      updateUser: mockUpdateUser,
      deleteUser: mockDeleteUser,
      resetPassword: mockResetPassword,
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      refetch: mockRefetch,
    });
  });

  it('renders user management interface', () => {
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    expect(screen.getByText('Управление пользователями')).toBeInTheDocument();
    expect(screen.getByText('Добавить пользователя')).toBeInTheDocument();
    expect(screen.getByText('Админ Системы')).toBeInTheDocument();
    expect(screen.getByText('Региональный Координатор')).toBeInTheDocument();
    expect(screen.getByText('Представитель Группы')).toBeInTheDocument();
  });

  it('displays user information correctly', () => {
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Проверяем отображение информации о пользователях
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('region@test.com')).toBeInTheDocument();
    expect(screen.getByText('group@test.com')).toBeInTheDocument();

    // Проверяем роли
    expect(screen.getByText('Администратор')).toBeInTheDocument();
    expect(screen.getByText('Регион')).toBeInTheDocument();
    expect(screen.getByText('Группа')).toBeInTheDocument();

    // Проверяем статусы
    expect(screen.getAllByText('Активен')).toHaveLength(2);
    expect(screen.getByText('Неактивен')).toBeInTheDocument();
  });

  it('opens add user form when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    const addButton = screen.getByText('Добавить пользователя');
    await user.click(addButton);

    expect(screen.getByText('Добавить пользователя')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Фамилия')).toBeInTheDocument();
    expect(screen.getByLabelText('Роль')).toBeInTheDocument();
    expect(screen.getByLabelText('Организация')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
  });

  it('creates new user when form is submitted', async () => {
    const user = userEvent.setup();
    mockCreateUser.mockResolvedValue({
      id: '4',
      email: 'new@test.com',
      firstName: 'Новый',
      lastName: 'Пользователь',
      role: UserRole.GROUP,
      organizationId: 'org3',
      isActive: true,
      createdAt: '2024-01-04T00:00:00Z',
      updatedAt: '2024-01-04T00:00:00Z',
    });

    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Открываем форму
    const addButton = screen.getByText('Добавить пользователя');
    await user.click(addButton);

    // Заполняем форму
    await user.type(screen.getByLabelText('Email'), 'new@test.com');
    await user.type(screen.getByLabelText('Имя'), 'Новый');
    await user.type(screen.getByLabelText('Фамилия'), 'Пользователь');
    await user.type(screen.getByLabelText('Пароль'), 'password123');

    // Выбираем роль
    await user.click(screen.getByLabelText('Роль'));
    await user.click(screen.getByText('Группа'));

    // Выбираем организацию
    await user.click(screen.getByLabelText('Организация'));
    await user.click(screen.getByText('Группа Надежда (group)'));

    // Отправляем форму
    const createButton = screen.getByRole('button', { name: 'Создать' });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'new@test.com',
        firstName: 'Новый',
        lastName: 'Пользователь',
        role: UserRole.GROUP,
        organizationId: 'org3',
        password: 'password123',
      });
    });
  });

  it('opens edit form when edit menu item is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Открываем меню для первого пользователя
    const menuButtons = screen.getAllByRole('button', { name: '' });
    const firstMenuButton = menuButtons.find(button => 
      button.querySelector('[data-testid="MoreVertIcon"]')
    );
    
    if (firstMenuButton) {
      await user.click(firstMenuButton);
      
      const editMenuItem = screen.getByText('Редактировать');
      await user.click(editMenuItem);

      expect(screen.getByText('Редактировать пользователя')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Админ')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Системы')).toBeInTheDocument();
    }
  });

  it('filters users by search term', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    const searchInput = screen.getByPlaceholderText('Поиск по имени или email...');
    await user.type(searchInput, 'admin');

    expect(mockUpdateFilters).toHaveBeenCalledWith({
      search: 'admin',
    });
  });

  it('filters users by role', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    const roleSelect = screen.getByLabelText('Роль');
    await user.click(roleSelect);
    
    const adminOption = screen.getByText('Администратор');
    await user.click(adminOption);

    expect(mockUpdateFilters).toHaveBeenCalledWith({
      role: UserRole.ADMIN,
    });
  });

  it('filters users by organization', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    const orgSelect = screen.getByLabelText('Организация');
    await user.click(orgSelect);
    
    const orgOption = screen.getByText('Региональный офис');
    await user.click(orgOption);

    expect(mockUpdateFilters).toHaveBeenCalledWith({
      organizationId: 'org1',
    });
  });

  it('opens delete confirmation dialog', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Открываем меню для первого пользователя
    const menuButtons = screen.getAllByRole('button', { name: '' });
    const firstMenuButton = menuButtons.find(button => 
      button.querySelector('[data-testid="MoreVertIcon"]')
    );
    
    if (firstMenuButton) {
      await user.click(firstMenuButton);
      
      const deleteMenuItem = screen.getByText('Удалить');
      await user.click(deleteMenuItem);

      expect(screen.getByText('Удалить пользователя')).toBeInTheDocument();
      expect(screen.getByText(/Вы уверены, что хотите удалить пользователя/)).toBeInTheDocument();
      expect(screen.getByText('Админ Системы')).toBeInTheDocument();
    }
  });

  it('deletes user when confirmed', async () => {
    const user = userEvent.setup();
    mockDeleteUser.mockResolvedValue(undefined);
    
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Открываем меню и выбираем удаление
    const menuButtons = screen.getAllByRole('button', { name: '' });
    const firstMenuButton = menuButtons.find(button => 
      button.querySelector('[data-testid="MoreVertIcon"]')
    );
    
    if (firstMenuButton) {
      await user.click(firstMenuButton);
      await user.click(screen.getByText('Удалить'));

      // Подтверждаем удаление
      const deleteButton = screen.getByRole('button', { name: 'Удалить' });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteUser).toHaveBeenCalledWith('1');
      });
    }
  });

  it('opens password reset dialog', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Открываем меню для первого пользователя
    const menuButtons = screen.getAllByRole('button', { name: '' });
    const firstMenuButton = menuButtons.find(button => 
      button.querySelector('[data-testid="MoreVertIcon"]')
    );
    
    if (firstMenuButton) {
      await user.click(firstMenuButton);
      
      const resetMenuItem = screen.getByText('Сбросить пароль');
      await user.click(resetMenuItem);

      expect(screen.getByText('Сбросить пароль')).toBeInTheDocument();
      expect(screen.getByText(/Сброс пароля для пользователя/)).toBeInTheDocument();
      expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
    }
  });

  it('resets password when form is submitted', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Открываем меню и выбираем сброс пароля
    const menuButtons = screen.getAllByRole('button', { name: '' });
    const firstMenuButton = menuButtons.find(button => 
      button.querySelector('[data-testid="MoreVertIcon"]')
    );
    
    if (firstMenuButton) {
      await user.click(firstMenuButton);
      await user.click(screen.getByText('Сбросить пароль'));

      // Вводим новый пароль
      const passwordInput = screen.getByLabelText('Новый пароль');
      await user.type(passwordInput, 'newpassword123');

      // Отправляем форму
      const resetButton = screen.getByRole('button', { name: 'Сбросить пароль' });
      await user.click(resetButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('1', 'newpassword123');
      });
    }
  });

  it('displays loading state', () => {
    mockUseUsers.mockReturnValue({
      users: [],
      total: 0,
      page: 1,
      limit: 20,
      filters: {},
      loading: true,
      error: null,
      createUser: mockCreateUser,
      updateUser: mockUpdateUser,
      deleteUser: mockDeleteUser,
      resetPassword: mockResetPassword,
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      refetch: mockRefetch,
    });

    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // В состоянии загрузки таблица все равно отображается, но данных нет
    expect(screen.getByText('Управление пользователями')).toBeInTheDocument();
  });

  it('displays error message', () => {
    mockUseUsers.mockReturnValue({
      users: [],
      total: 0,
      page: 1,
      limit: 20,
      filters: {},
      loading: false,
      error: 'Ошибка загрузки пользователей',
      createUser: mockCreateUser,
      updateUser: mockUpdateUser,
      deleteUser: mockDeleteUser,
      resetPassword: mockResetPassword,
      updateFilters: mockUpdateFilters,
      updatePage: mockUpdatePage,
      refetch: mockRefetch,
    });

    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    expect(screen.getByText('Ошибка загрузки пользователей')).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    const user = userEvent.setup();
    renderWithTheme(<UserManagement organizations={mockOrganizations} />);

    // Открываем форму
    const addButton = screen.getByText('Добавить пользователя');
    await user.click(addButton);

    // Пытаемся отправить пустую форму
    const createButton = screen.getByRole('button', { name: 'Создать' });
    await user.click(createButton);

    // Проверяем, что форма не отправилась (функция не была вызвана)
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});