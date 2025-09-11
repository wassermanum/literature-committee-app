# Система кэширования и оптимизации

Этот документ описывает реализованную систему кэширования и оптимизации производительности для приложения литературного комитета.

## Архитектура кэширования

### React Query Configuration
- **Файл**: `src/config/queryClient.ts`
- **Описание**: Централизованная конфигурация React Query с оптимизированными настройками кэширования

#### Конфигурация кэша по типам данных:

```typescript
// Статические данные (каталог литературы, организации)
static: {
  staleTime: 5 * 60 * 1000,    // 5 минут
  cacheTime: 30 * 60 * 1000,   // 30 минут
}

// Динамические данные (заказы, остатки)
dynamic: {
  staleTime: 30 * 1000,        // 30 секунд
  cacheTime: 5 * 60 * 1000,    // 5 минут
}

// Пользовательские данные
user: {
  staleTime: 10 * 60 * 1000,   // 10 минут
  cacheTime: 60 * 60 * 1000,   // 1 час
}

// Отчеты
reports: {
  staleTime: 2 * 60 * 1000,    // 2 минуты
  cacheTime: 10 * 60 * 1000,   // 10 минут
}
```

### Ключи кэширования
Система использует иерархические ключи для эффективной инвалидации:

```typescript
// Заказы
queryKeys.orders.all                    // ['orders']
queryKeys.orders.list(filters)          // ['orders', 'list', filters]
queryKeys.orders.detail(id)             // ['orders', 'detail', id]

// Литература
queryKeys.literature.all                // ['literature']
queryKeys.literature.list(filters)      // ['literature', 'list', filters]
queryKeys.literature.inventory(id)      // ['literature', 'detail', id, 'inventory']
```

## Оптимизированные хуки

### useOptimizedOrders
- **Файл**: `src/hooks/useOptimizedQueries.ts`
- **Функции**:
  - Кэширование списков заказов
  - Оптимистичные обновления
  - Предварительная загрузка связанных данных
  - Бесконечная прокрутка

```typescript
const { useOrdersList, useCreateOrder, useUpdateOrder } = useOptimizedOrders();

// Список с кэшированием
const { data, loading, error } = useOrdersList(filters, { page: 1, limit: 20 });

// Создание с оптимистичными обновлениями
const createMutation = useCreateOrder();
createMutation.mutate(newOrder);
```

### useOptimizedLiterature
- Кэширование каталога литературы
- Предварительная загрузка деталей
- Кэширование остатков на складах

### useOptimizedAuth
- Кэширование профиля пользователя
- Автоматическая очистка кэша при выходе

## Пагинация и виртуализация

### Компонент Pagination
- **Файл**: `src/components/common/Pagination.tsx`
- **Функции**:
  - Стандартная пагинация с настраиваемыми параметрами
  - Бесконечная прокрутка
  - Управление состоянием пагинации

```typescript
const { page, itemsPerPage, handlePageChange } = usePagination({
  initialPage: 1,
  initialItemsPerPage: 20,
  totalItems: 1000,
});

<Pagination
  page={page}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
/>
```

### Виртуализация списков
- **Файл**: `src/components/common/VirtualizedList.tsx`
- **Компоненты**:
  - `VirtualizedList` - для больших списков
  - `VirtualizedTable` - для таблиц
  - `VirtualizedGrid` - для сеток

```typescript
<VirtualizedList
  items={largeDataset}
  height={400}
  itemHeight={50}
  renderItem={({ index, style, data }) => (
    <div key={index} style={style}>
      {data[index].name}
    </div>
  )}
/>
```

## Мониторинг производительности

### Performance Monitor
- **Файл**: `src/utils/performance.ts`
- **Функции**:
  - Измерение времени выполнения операций
  - Мониторинг использования памяти
  - Отслеживание метрик навигации
  - Логирование медленных операций

```typescript
// Измерение функции
performanceMonitor.measureFunction('orderCreation', () => {
  return createOrder(orderData);
});

// Измерение асинхронной операции
await performanceMonitor.measureAsync('apiCall', async () => {
  return await fetchOrders();
});

// Декораторы для методов
@measurePerformance('processOrder')
processOrder(order: Order) {
  // Обработка заказа
}
```

### Компонент мониторинга
- **Файл**: `src/components/common/PerformanceMonitor.tsx`
- **Отображает**:
  - Использование памяти в реальном времени
  - Статистику кэша React Query
  - Метрики производительности операций
  - Предупреждения о медленных операциях

## Оптимизации производительности

### 1. Кэширование запросов
```typescript
// Автоматическое кэширование с React Query
const { data } = useQuery({
  queryKey: ['orders', filters],
  queryFn: () => ordersService.getOrders(filters),
  staleTime: 30 * 1000, // 30 секунд
  cacheTime: 5 * 60 * 1000, // 5 минут
});
```

### 2. Оптимистичные обновления
```typescript
const createOrderMutation = useMutation({
  mutationFn: ordersService.createOrder,
  onMutate: async (newOrder) => {
    // Отменяем исходящие запросы
    await queryClient.cancelQueries(['orders']);
    
    // Оптимистично обновляем кэш
    queryClient.setQueryData(['orders'], (old) => [newOrder, ...old]);
  },
  onError: (err, newOrder, context) => {
    // Откатываем изменения при ошибке
    queryClient.setQueryData(['orders'], context.previousOrders);
  },
});
```

### 3. Предварительная загрузка
```typescript
// Предзагрузка деталей заказа при наведении
const prefetchOrderDetails = (orderId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['orders', 'detail', orderId],
    queryFn: () => ordersService.getOrderById(orderId),
  });
};
```

### 4. Виртуализация больших списков
```typescript
// Рендер только видимых элементов
<VirtualizedList
  items={orders}
  height={600}
  itemHeight={80}
  renderItem={OrderItem}
/>
```

### 5. Мемоизация компонентов
```typescript
const OrderItem = React.memo(({ order }) => {
  return <div>{order.orderNumber}</div>;
});

const OrderList = () => {
  const memoizedOrders = useMemo(() => 
    orders.filter(order => order.status === 'active'),
    [orders]
  );
  
  return <div>{memoizedOrders.map(OrderItem)}</div>;
};
```

### 6. Дебаунсинг поиска
```typescript
const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  
  return { query, setQuery, debouncedQuery };
};
```

## Тестирование производительности

### Тесты кэширования
- **Файл**: `src/__tests__/performance/queryOptimization.test.ts`
- **Проверяет**:
  - Корректность кэширования запросов
  - Оптимистичные обновления
  - Откат изменений при ошибках
  - Время выполнения запросов

### Тесты виртуализации
- **Файл**: `src/__tests__/performance/virtualization.test.tsx`
- **Проверяет**:
  - Рендеринг больших списков
  - Производительность виртуализации
  - Управление памятью

### Метрики производительности
```typescript
describe('Performance Tests', () => {
  it('should render 10000 items in less than 100ms', () => {
    const startTime = performance.now();
    render(<VirtualizedList items={largeDataset} />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(100);
  });
  
  it('should not cause memory leaks', () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    // ... тест компонента
    const finalMemory = performance.memory.usedJSHeapSize;
    
    expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024);
  });
});
```

## Рекомендации по использованию

### 1. Выбор стратегии кэширования
- **Статические данные**: Длительное кэширование (5-30 минут)
- **Динамические данные**: Короткое кэширование (30 секунд - 5 минут)
- **Пользовательские данные**: Среднее кэширование (10-60 минут)

### 2. Оптимизация списков
- Используйте виртуализацию для списков > 100 элементов
- Применяйте пагинацию для списков > 1000 элементов
- Мемоизируйте элементы списков

### 3. Управление памятью
- Регулярно очищайте устаревшие запросы
- Используйте `React.memo` для предотвращения лишних рендеров
- Отписывайтесь от подписок в `useEffect` cleanup

### 4. Мониторинг
- Включайте Performance Monitor в development
- Отслеживайте медленные операции (> 100ms)
- Мониторьте использование памяти (< 80% лимита)

## Конфигурация для production

### Переменные окружения
```env
# Отключение мониторинга в production
REACT_APP_ENABLE_PERFORMANCE_MONITOR=false

# Настройки кэширования
REACT_APP_CACHE_STATIC_TIME=300000
REACT_APP_CACHE_DYNAMIC_TIME=30000
```

### Оптимизация сборки
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

## Мониторинг в production

### Метрики для отслеживания
- Время загрузки страниц
- Размер кэша React Query
- Использование памяти
- Количество API запросов
- Время отклика API

### Алерты
- Использование памяти > 80%
- Время загрузки > 3 секунды
- Количество ошибок кэша > 5%
- Размер кэша > 50MB

Система кэширования и оптимизации обеспечивает высокую производительность приложения при работе с большими объемами данных и минимизирует нагрузку на сервер за счет эффективного кэширования.