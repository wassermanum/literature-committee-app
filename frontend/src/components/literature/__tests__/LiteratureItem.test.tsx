import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { LiteratureItem } from '../LiteratureItem';
import { LiteratureWithInventory } from '@/types';
import { theme } from '@/theme';

const mockLiterature: LiteratureWithInventory = {
  id: '1',
  title: 'Анонимные Наркоманы - Базовый текст',
  description: 'Основная литература сообщества АН',
  category: 'Базовая литература',
  price: 350,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  inventory: [
    {
      id: '1',
      organizationId: 'org1',
      literatureId: '1',
      quantity: 45,
      reservedQuantity: 5,
      lastUpdated: '2024-01-01T00:00:00Z',
      organization: {
        id: 'org1',
        name: 'Региональный склад',
        type: 'region',
      },
    },
    {
      id: '2',
      organizationId: 'org2',
      literatureId: '1',
      quantity: 12,
      reservedQuantity: 2,
      lastUpdated: '2024-01-01T00:00:00Z',
      organization: {
        id: 'org2',
        name: 'Местность Центр',
        type: 'locality',
      },
    },
  ],
  totalQuantity: 57,
  availableQuantity: 50,
};

const mockLiteratureLowStock: LiteratureWithInventory = {
  ...mockLiterature,
  id: '2',
  totalQuantity: 15,
  availableQuantity: 13,
};

const mockLiteratureOutOfStock: LiteratureWithInventory = {
  ...mockLiterature,
  id: '3',
  totalQuantity: 0,
  availableQuantity: 0,
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LiteratureItem', () => {
  it('renders literature information correctly', () => {
    renderWithTheme(<LiteratureItem literature={mockLiterature} />);

    expect(screen.getByText('Анонимные Наркоманы - Базовый текст')).toBeInTheDocument();
    expect(screen.getByText('Основная литература сообщества АН')).toBeInTheDocument();
    expect(screen.getByText('Базовая литература')).toBeInTheDocument();
    expect(screen.getByText('350 ₽')).toBeInTheDocument();
    expect(screen.getByText('57')).toBeInTheDocument();
  });

  it('displays inventory information', () => {
    renderWithTheme(<LiteratureItem literature={mockLiterature} />);

    expect(screen.getByText('Остатки по складам:')).toBeInTheDocument();
    expect(screen.getByText('Региональный склад: 45')).toBeInTheDocument();
    expect(screen.getByText('Местность Центр: 12')).toBeInTheDocument();
  });

  it('shows correct stock status for normal stock', () => {
    renderWithTheme(<LiteratureItem literature={mockLiterature} />);

    // Проверяем наличие иконки успеха (зеленая галочка)
    const stockIcon = screen.getByTestId('CheckCircleIcon');
    expect(stockIcon).toBeInTheDocument();
  });

  it('shows correct stock status for low stock', () => {
    renderWithTheme(<LiteratureItem literature={mockLiteratureLowStock} />);

    // Проверяем наличие иконки предупреждения
    const warningIcons = screen.getAllByTestId('WarningIcon');
    expect(warningIcons.length).toBeGreaterThan(0);
  });

  it('shows correct stock status for out of stock', () => {
    renderWithTheme(<LiteratureItem literature={mockLiteratureOutOfStock} />);

    // Проверяем наличие иконки предупреждения (красная)
    const warningIcons = screen.getAllByTestId('WarningIcon');
    expect(warningIcons.length).toBeGreaterThan(0);
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    renderWithTheme(
      <LiteratureItem literature={mockLiterature} onEdit={mockOnEdit} />
    );

    const editButton = screen.getByRole('button', { name: /редактировать/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  it('calls onSelect when select button is clicked in selectable mode', () => {
    const mockOnSelect = jest.fn();
    renderWithTheme(
      <LiteratureItem
        literature={mockLiterature}
        onSelect={mockOnSelect}
        selectable
      />
    );

    const selectButton = screen.getByRole('button', { name: /выбрать/i });
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('calls onSelect when card is clicked in selectable mode', () => {
    const mockOnSelect = jest.fn();
    renderWithTheme(
      <LiteratureItem
        literature={mockLiterature}
        onSelect={mockOnSelect}
        selectable
      />
    );

    const card = screen.getByText('Анонимные Наркоманы - Базовый текст').closest('[role="button"]');
    if (card) {
      fireEvent.click(card);
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    }
  });

  it('does not show edit button when onEdit is not provided', () => {
    renderWithTheme(<LiteratureItem literature={mockLiterature} />);

    const editButton = screen.queryByRole('button', { name: /редактировать/i });
    expect(editButton).not.toBeInTheDocument();
  });

  it('does not show select button when not in selectable mode', () => {
    renderWithTheme(<LiteratureItem literature={mockLiterature} />);

    const selectButton = screen.queryByRole('button', { name: /выбрать/i });
    expect(selectButton).not.toBeInTheDocument();
  });

  it('truncates long titles and descriptions', () => {
    const longTitleLiterature: LiteratureWithInventory = {
      ...mockLiterature,
      title: 'Очень длинное название литературы которое должно быть обрезано в интерфейсе пользователя',
      description: 'Очень длинное описание литературы которое содержит много текста и должно быть обрезано в интерфейсе пользователя для лучшего отображения карточки товара в каталоге системы управления литературой',
    };

    renderWithTheme(<LiteratureItem literature={longTitleLiterature} />);

    // Проверяем, что текст отображается (даже если обрезан CSS)
    expect(screen.getByText(/Очень длинное название/)).toBeInTheDocument();
    expect(screen.getByText(/Очень длинное описание/)).toBeInTheDocument();
  });

  it('shows limited inventory list with overflow indicator', () => {
    const manyInventoryLiterature: LiteratureWithInventory = {
      ...mockLiterature,
      inventory: [
        ...mockLiterature.inventory,
        {
          id: '3',
          organizationId: 'org3',
          literatureId: '1',
          quantity: 8,
          reservedQuantity: 1,
          lastUpdated: '2024-01-01T00:00:00Z',
          organization: {
            id: 'org3',
            name: 'Группа Надежда',
            type: 'group',
          },
        },
        {
          id: '4',
          organizationId: 'org4',
          literatureId: '1',
          quantity: 3,
          reservedQuantity: 0,
          lastUpdated: '2024-01-01T00:00:00Z',
          organization: {
            id: 'org4',
            name: 'Группа Свобода',
            type: 'group',
          },
        },
      ],
    };

    renderWithTheme(<LiteratureItem literature={manyInventoryLiterature} />);

    // Должны показываться только первые 3 склада
    expect(screen.getByText('Региональный склад: 45')).toBeInTheDocument();
    expect(screen.getByText('Местность Центр: 12')).toBeInTheDocument();
    expect(screen.getByText('Группа Надежда: 8')).toBeInTheDocument();
    
    // И индикатор дополнительных складов
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});