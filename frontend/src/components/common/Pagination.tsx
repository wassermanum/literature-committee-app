import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';

interface PaginationProps {
  // Основные параметры пагинации
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  
  // Колбэки
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  
  // Настройки отображения
  showItemsPerPage?: boolean;
  showTotalItems?: boolean;
  showFirstLast?: boolean;
  itemsPerPageOptions?: number[];
  
  // Стилизация
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'standard';
  
  // Состояние загрузки
  loading?: boolean;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showTotalItems = true,
  showFirstLast = false,
  itemsPerPageOptions = [10, 20, 50, 100],
  size = 'medium',
  variant = 'outlined',
  color = 'primary',
  loading = false,
  disabled = false,
}) => {
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    if (!loading && !disabled) {
      onPageChange(newPage);
    }
  };

  const handleItemsPerPageChange = (event: any) => {
    const newItemsPerPage = event.target.value as number;
    onItemsPerPageChange(newItemsPerPage);
    // Пересчитываем текущую страницу при изменении количества элементов
    const newPage = Math.ceil(startItem / newItemsPerPage);
    onPageChange(newPage);
  };

  const handleFirstPage = () => {
    if (!loading && !disabled && page > 1) {
      onPageChange(1);
    }
  };

  const handleLastPage = () => {
    if (!loading && !disabled && page < totalPages) {
      onPageChange(totalPages);
    }
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        p: 2,
      }}
    >
      {/* Информация о количестве элементов */}
      {showTotalItems && (
        <Typography variant="body2" color="text.secondary">
          Показано {startItem}-{endItem} из {totalItems} элементов
        </Typography>
      )}

      {/* Основная пагинация */}
      <Stack direction="row" alignItems="center" spacing={1}>
        {/* Кнопки первой и последней страницы */}
        {showFirstLast && (
          <>
            <Tooltip title="Первая страница">
              <span>
                <IconButton
                  onClick={handleFirstPage}
                  disabled={loading || disabled || page === 1}
                  size={size}
                >
                  <FirstPage />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Предыдущая страница">
              <span>
                <IconButton
                  onClick={() => onPageChange(page - 1)}
                  disabled={loading || disabled || page === 1}
                  size={size}
                >
                  <NavigateBefore />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}

        {/* Основная пагинация Material-UI */}
        <MuiPagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          variant={variant}
          color={color}
          size={size}
          disabled={loading || disabled}
          showFirstButton={!showFirstLast}
          showLastButton={!showFirstLast}
          siblingCount={1}
          boundaryCount={1}
        />

        {/* Кнопки первой и последней страницы */}
        {showFirstLast && (
          <>
            <Tooltip title="Следующая страница">
              <span>
                <IconButton
                  onClick={() => onPageChange(page + 1)}
                  disabled={loading || disabled || page === totalPages}
                  size={size}
                >
                  <NavigateNext />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="Последняя страница">
              <span>
                <IconButton
                  onClick={handleLastPage}
                  disabled={loading || disabled || page === totalPages}
                  size={size}
                >
                  <LastPage />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Stack>

      {/* Выбор количества элементов на странице */}
      {showItemsPerPage && (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>На странице</InputLabel>
          <Select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            label="На странице"
            disabled={loading || disabled}
          >
            {itemsPerPageOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

// Компонент для бесконечной прокрутки
interface InfiniteScrollProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  children: React.ReactNode;
  threshold?: number;
  loader?: React.ReactNode;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  children,
  threshold = 100,
  loader,
}) => {
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      
      if (
        scrollHeight - scrollTop <= clientHeight + threshold &&
        hasNextPage &&
        !isFetchingNextPage &&
        !isFetching
      ) {
        setIsFetching(true);
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, isFetching, threshold, fetchNextPage]);

  React.useEffect(() => {
    if (!isFetchingNextPage) {
      setIsFetching(false);
    }
  }, [isFetchingNextPage]);

  return (
    <>
      {children}
      {isFetchingNextPage && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          {loader || <Typography>Загрузка...</Typography>}
        </Box>
      )}
    </>
  );
};

// Хук для управления пагинацией
interface UsePaginationProps {
  initialPage?: number;
  initialItemsPerPage?: number;
  totalItems: number;
}

export const usePagination = ({
  initialPage = 1,
  initialItemsPerPage = 20,
  totalItems,
}: UsePaginationProps) => {
  const [page, setPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Корректируем страницу если она выходит за границы
  React.useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handlePageChange = React.useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleItemsPerPageChange = React.useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Пересчитываем текущую страницу
    const currentFirstItem = (page - 1) * itemsPerPage + 1;
    const newPage = Math.ceil(currentFirstItem / newItemsPerPage);
    setPage(newPage);
  }, [page, itemsPerPage]);

  const reset = React.useCallback(() => {
    setPage(initialPage);
    setItemsPerPage(initialItemsPerPage);
  }, [initialPage, initialItemsPerPage]);

  return {
    page,
    itemsPerPage,
    totalPages,
    handlePageChange,
    handleItemsPerPageChange,
    reset,
  };
};

export default Pagination;