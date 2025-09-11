import { useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { Box, Typography } from '@mui/material';
import { LoadingState } from './LoadingState';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  overscan?: number;
  width?: string | number;
  className?: string;
}

// Компонент для виртуализации списков с фиксированной высотой элементов
export const VirtualizedList = <T,>({
  items,
  height,
  itemHeight,
  renderItem,
  loading = false,
  error = null,
  emptyMessage = 'Нет данных для отображения',
  overscan = 5,
  width = '100%',
  className,
}: VirtualizedListProps<T>) => {
  const ListComponent = useMemo(() => {
    return typeof itemHeight === 'function' ? VariableSizeList as any : List as any;
  }, [itemHeight]);

  const memoizedRenderItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      return renderItem({ index, style, data: items });
    },
    [renderItem, items]
  );

  if (loading) {
    return <LoadingState message="Загрузка списка..." />;
  }

  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={height}
        p={2}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={height}
        p={2}
      >
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Box className={className} width={width}>
      <ListComponent
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={items}
        overscanCount={overscan}
        width={width}
      >
        {memoizedRenderItem}
      </ListComponent>
    </Box>
  );
};

// Компонент для виртуализации таблиц
interface VirtualizedTableProps<T> {
  items: T[];
  columns: Array<{
    key: string;
    label: string;
    width: number;
    render?: (item: T, index: number) => React.ReactNode;
  }>;
  height: number;
  rowHeight: number;
  headerHeight?: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
}

export const VirtualizedTable = <T,>({
  items,
  columns,
  height,
  rowHeight,
  headerHeight = 48,
  loading = false,
  error = null,
  emptyMessage = 'Нет данных для отображения',
  onRowClick,
}: VirtualizedTableProps<T>) => {
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => sum + col.width, 0);
  }, [columns]);

  const renderRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index];
      
      return (
        <Box
          style={style}
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: onRowClick ? 'pointer' : 'default',
            '&:hover': onRowClick ? {
              backgroundColor: 'action.hover',
            } : {},
          }}
          onClick={() => item && onRowClick?.(item, index)}
        >
          {columns.map((column) => (
            <Box
              key={column.key}
              sx={{
                width: column.width,
                px: 2,
                py: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {column.render && item
                ? column.render(item, index)
                : item ? (item as any)[column.key] : ''
              }
            </Box>
          ))}
        </Box>
      );
    },
    [items, columns, onRowClick]
  );

  if (loading) {
    return <LoadingState message="Загрузка таблицы..." />;
  }

  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={height}
        p={2}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box width={totalWidth}>
      {/* Заголовок таблицы */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: headerHeight,
          backgroundColor: 'background.paper',
          borderBottom: '2px solid',
          borderColor: 'divider',
          fontWeight: 'bold',
        }}
      >
        {columns.map((column) => (
          <Box
            key={column.key}
            sx={{
              width: column.width,
              px: 2,
              py: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              {column.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Тело таблицы */}
      {items.length === 0 ? (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={height - headerHeight}
          p={2}
        >
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <List
          height={height - headerHeight}
          itemCount={items.length}
          itemSize={rowHeight}
          width={totalWidth}
          overscanCount={5}
        >
          {renderRow}
        </List>
      )}
    </Box>
  );
};

// Компонент для виртуализации сетки (grid)
interface VirtualizedGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (props: { 
    columnIndex: number; 
    rowIndex: number; 
    style: React.CSSProperties; 
    data: T[][] 
  }) => React.ReactElement;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  gap?: number;
}

export const VirtualizedGrid = <T,>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  loading = false,
  error = null,
  emptyMessage = 'Нет данных для отображения',
  gap = 8,
}: VirtualizedGridProps<T>) => {
  const { FixedSizeGrid: Grid } = require('react-window');

  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);

  // Преобразуем одномерный массив в двумерный для сетки
  const gridData = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < rowsCount; i++) {
      result[i] = [];
      for (let j = 0; j < columnsCount; j++) {
        const index = i * columnsCount + j;
        if (index < items.length) {
          result[i]![j] = items[index]!;
        }
      }
    }
    return result;
  }, [items, rowsCount, columnsCount]);

  const memoizedRenderItem = useCallback(
    ({ columnIndex, rowIndex, style }: { 
      columnIndex: number; 
      rowIndex: number; 
      style: React.CSSProperties; 
    }) => {
      return renderItem({ columnIndex, rowIndex, style, data: gridData });
    },
    [renderItem, gridData]
  );

  if (loading) {
    return <LoadingState message="Загрузка сетки..." />;
  }

  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={containerHeight}
        p={2}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height={containerHeight}
        p={2}
      >
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Grid
      columnCount={columnsCount}
      columnWidth={itemWidth + gap}
      height={containerHeight}
      rowCount={rowsCount}
      rowHeight={itemHeight + gap}
      width={containerWidth}
      overscanColumnCount={2}
      overscanRowCount={2}
    >
      {memoizedRenderItem}
    </Grid>
  );
};

// Хук для оптимизации рендеринга больших списков
export const useVirtualization = <T,>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  buffer: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, buffer, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    handleScroll,
  };
};

export default VirtualizedList;