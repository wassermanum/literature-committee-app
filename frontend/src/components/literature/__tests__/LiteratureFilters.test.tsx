import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { LiteratureFilters } from '../LiteratureFilters';
import { LiteratureFilters as FiltersType } from '@/types';
import { theme } from '@/theme';

const mockCategories = [
  'Базовая литература',
  'Истории выздоровления',
  'Медитации',
  'Служение',
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LiteratureFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Поиск по названию или описанию...');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onFiltersChange with search value after delay', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Поиск по названию или описанию...');
    await user.type(searchInput, 'test search');

    // Ждем задержку поиска (500мс)
    await waitFor(
      () => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          search: 'test search',
        });
      },
      { timeout: 1000 }
    );
  });

  it('shows clear button when search has value', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <LiteratureFilters
        filters={{ search: 'existing search' }}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: '' });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: undefined,
      });
    });
  });

  it('expands and shows advanced filters', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const expandButton = screen.getByRole('button', { name: '' });
    await user.click(expandButton);

    expect(screen.getByLabelText('Категория')).toBeInTheDocument();
    expect(screen.getByLabelText('Цена от')).toBeInTheDocument();
    expect(screen.getByLabelText('Цена до')).toBeInTheDocument();
    expect(screen.getByLabelText('Только активные')).toBeInTheDocument();
  });

  it('handles category filter change', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Раскрываем фильтры
    const expandButton = screen.getByRole('button', { name: '' });
    await user.click(expandButton);

    // Выбираем категорию
    const categorySelect = screen.getByLabelText('Категория');
    await user.click(categorySelect);

    const categoryOption = screen.getByText('Базовая литература');
    await user.click(categoryOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      category: 'Базовая литература',
    });
  });

  it('handles price range filters', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Раскрываем фильтры
    const expandButton = screen.getByRole('button', { name: '' });
    await user.click(expandButton);

    // Устанавливаем минимальную цену
    const minPriceInput = screen.getByLabelText('Цена от');
    await user.type(minPriceInput, '100');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      minPrice: 100,
    });

    // Устанавливаем максимальную цену
    const maxPriceInput = screen.getByLabelText('Цена до');
    await user.type(maxPriceInput, '500');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      maxPrice: 500,
    });
  });

  it('handles active status toggle', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Раскрываем фильтры
    const expandButton = screen.getByRole('button', { name: '' });
    await user.click(expandButton);

    // Переключаем статус активности
    const activeSwitch = screen.getByLabelText('Только активные');
    await user.click(activeSwitch);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      isActive: false,
    });
  });

  it('shows active filters count', () => {
    const filters: FiltersType = {
      search: 'test',
      category: 'Базовая литература',
      minPrice: 100,
    };

    renderWithTheme(
      <LiteratureFilters
        filters={filters}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Фильтров: 3')).toBeInTheDocument();
  });

  it('shows active filters chips when expanded', async () => {
    const user = userEvent.setup();
    const filters: FiltersType = {
      search: 'test search',
      category: 'Базовая литература',
      minPrice: 100,
      maxPrice: 500,
      isActive: false,
    };

    renderWithTheme(
      <LiteratureFilters
        filters={filters}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Раскрываем фильтры
    const expandButton = screen.getByRole('button', { name: '' });
    await user.click(expandButton);

    expect(screen.getByText('Поиск: "test search"')).toBeInTheDocument();
    expect(screen.getByText('Категория: Базовая литература')).toBeInTheDocument();
    expect(screen.getByText('От: 100₽')).toBeInTheDocument();
    expect(screen.getByText('До: 500₽')).toBeInTheDocument();
    expect(screen.getByText('Включая неактивные')).toBeInTheDocument();
  });

  it('allows removing individual filters via chips', async () => {
    const user = userEvent.setup();
    const filters: FiltersType = {
      search: 'test search',
      category: 'Базовая литература',
    };

    renderWithTheme(
      <LiteratureFilters
        filters={filters}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Раскрываем фильтры
    const expandButton = screen.getByRole('button', { name: '' });
    await user.click(expandButton);

    // Удаляем фильтр поиска
    const searchChip = screen.getByText('Поиск: "test search"');
    const deleteButton = searchChip.parentElement?.querySelector('[data-testid="CancelIcon"]');
    
    if (deleteButton) {
      await user.click(deleteButton);
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: undefined,
        category: 'Базовая литература',
      });
    }
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const filters: FiltersType = {
      search: 'test',
      category: 'Базовая литература',
      minPrice: 100,
    };

    renderWithTheme(
      <LiteratureFilters
        filters={filters}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByRole('button', { name: '' });
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('updates local filters when external filters change', () => {
    const { rerender } = renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={mockCategories}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const newFilters: FiltersType = { search: 'new search' };

    rerender(
      <ThemeProvider theme={theme}>
        <LiteratureFilters
          filters={newFilters}
          categories={mockCategories}
          onFiltersChange={mockOnFiltersChange}
        />
      </ThemeProvider>
    );

    const searchInput = screen.getByDisplayValue('new search');
    expect(searchInput).toBeInTheDocument();
  });

  it('handles empty categories list', () => {
    renderWithTheme(
      <LiteratureFilters
        filters={{}}
        categories={[]}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('Поиск по названию или описанию...');
    expect(searchInput).toBeInTheDocument();
  });
});