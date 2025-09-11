# Frontend-Backend Integration

Этот документ описывает интеграцию между frontend и backend частями приложения литературного комитета.

## Архитектура интеграции

### HTTP Client
- **Файл**: `src/services/httpClient.ts`
- **Описание**: Централизованный HTTP клиент на основе Axios с автоматической обработкой токенов и ошибок
- **Функции**:
  - Автоматическое добавление JWT токенов к запросам
  - Автоматическое обновление токенов при получении 401 ошибки
  - Перенаправление на страницу входа при неудачном обновлении токена

### Глобальная обработка ошибок
- **Файл**: `src/utils/errorHandler.ts`
- **Описание**: Централизованная система обработки ошибок с пользовательскими уведомлениями
- **Функции**:
  - Обработка HTTP ошибок с соответствующими сообщениями
  - Поддержка бизнес-кодов ошибок
  - Интеграция с React Error Boundary
  - Локализованные сообщения об ошибках

### Компоненты состояний
- **Файлы**: 
  - `src/components/common/LoadingState.tsx`
  - `src/components/common/ErrorBoundary.tsx`
  - `src/components/common/NotificationProvider.tsx`
- **Описание**: Компоненты для отображения различных состояний приложения

### API Hooks
- **Файл**: `src/hooks/useApi.ts`
- **Описание**: React хуки для работы с API запросами
- **Функции**:
  - `useApi` - базовый хук для API запросов
  - `useApiMutation` - хук для мутаций (создание, обновление, удаление)
  - `useFetch` - хук для получения данных
  - `usePaginatedFetch` - хук для пагинированных запросов

## Использование

### Базовый API запрос

```typescript
import { useFetch } from '../hooks/useApi';
import { ordersService } from '../services/ordersService';

const OrdersList = () => {
  const { fetch, data, loading, error } = useFetch<Order[]>();

  useEffect(() => {
    fetch(() => ordersService.getOrders());
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      {data?.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
};
```

### Мутации с уведомлениями

```typescript
import { useApiMutation } from '../hooks/useApi';
import { ordersService } from '../services/ordersService';
import { showNotification } from '../components/common/NotificationProvider';

const CreateOrderForm = () => {
  const { mutate, loading } = useApiMutation<Order>();

  const handleSubmit = async (orderData: CreateOrderRequest) => {
    const result = await mutate(
      () => ordersService.createOrder(orderData),
      {
        successMessage: 'Заказ успешно создан',
        onSuccess: (order) => {
          showNotification.orderCreated(order.orderNumber);
        }
      }
    );

    if (result) {
      // Дополнительная логика после успешного создания
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Форма создания заказа */}
      <button type="submit" disabled={loading}>
        {loading ? 'Создание...' : 'Создать заказ'}
      </button>
    </form>
  );
};
```

### Обработка состояний загрузки

```typescript
import { WithLoading, LoadingState, SkeletonLoader } from '../components/common/LoadingState';

const OrdersPage = () => {
  const { data, loading, error } = useFetch<Order[]>();

  return (
    <WithLoading 
      loading={loading} 
      error={error}
      loadingComponent={<SkeletonLoader rows={5} />}
    >
      <OrdersList orders={data || []} />
    </WithLoading>
  );
};
```

## Коды ошибок

Система поддерживает следующие коды ошибок:

### Аутентификация
- `AUTH_001` - Необходима авторизация
- `AUTH_002` - Недостаточно прав доступа
- `AUTH_003` - Неверные учетные данные

### Валидация
- `VAL_001` - Ошибка валидации данных
- `VAL_002` - Обязательное поле не заполнено
- `VAL_003` - Неверный формат данных

### Бизнес-логика
- `BIZ_001` - Недостаточно товара на складе
- `BIZ_002` - Недопустимый статус заказа
- `BIZ_003` - Ошибка иерархии организаций
- `BIZ_004` - Заказ заблокирован для редактирования
- `BIZ_005` - Недопустимый переход статуса

### Система
- `SYS_001` - Ошибка базы данных
- `SYS_002` - Ошибка внешнего сервиса
- `SYS_003` - Внутренняя ошибка сервера

## Уведомления

Система поддерживает различные типы уведомлений:

### Стандартные уведомления
```typescript
import { showNotification } from '../components/common/NotificationProvider';

// Успех
showNotification.success('Операция выполнена успешно');

// Ошибка
showNotification.error('Произошла ошибка');

// Информация
showNotification.info('Информационное сообщение');

// Предупреждение
showNotification.warning('Предупреждение');
```

### Бизнес-уведомления
```typescript
// Заказы
showNotification.orderCreated('ORD-001');
showNotification.orderUpdated('ORD-001');
showNotification.orderStatusChanged('ORD-001', 'approved');
showNotification.orderLocked('ORD-001');

// Литература
showNotification.literatureAdded('Базовый текст');
showNotification.literatureUpdated('Базовый текст');

// Склад
showNotification.lowInventory('Базовый текст', 5);
showNotification.inventoryUpdated();

// Отчеты
showNotification.reportGenerated('Финансовый отчет');
```

## Тестирование

### Запуск тестов
```bash
npm run test
npm run test:watch
```

### Структура тестов
- `__tests__/integration/` - Интеграционные тесты
- `components/**/__tests__/` - Тесты компонентов
- `services/**/__tests__/` - Тесты сервисов
- `hooks/**/__tests__/` - Тесты хуков

### Покрытие тестами
Интеграционные тесты покрывают:
- HTTP клиент и обработка токенов
- Глобальная обработка ошибок
- API хуки и состояния
- Компоненты загрузки и ошибок
- Полная интеграция frontend-backend

## Конфигурация

### Переменные окружения
```env
REACT_APP_API_URL=http://localhost:3001/api
```

### Настройка HTTP клиента
```typescript
// src/services/httpClient.ts
const httpClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});
```

## Мониторинг и отладка

### Логирование
- Все ошибки логируются в консоль браузера
- В production режиме детали ошибок скрыты от пользователя
- В development режиме показываются полные стеки ошибок

### Отладка API запросов
```typescript
// Включить детальное логирование в development
if (process.env.NODE_ENV === 'development') {
  httpClient.interceptors.request.use(request => {
    console.log('Starting Request:', request);
    return request;
  });

  httpClient.interceptors.response.use(
    response => {
      console.log('Response:', response);
      return response;
    },
    error => {
      console.log('Response Error:', error);
      return Promise.reject(error);
    }
  );
}
```

## Производительность

### Оптимизации
- Автоматическое кэширование с React Query
- Ленивая загрузка компонентов
- Дебаунсинг для поисковых запросов
- Пагинация для больших списков

### Мониторинг производительности
- Измерение времени API запросов
- Отслеживание размера бандла
- Мониторинг использования памяти

## Безопасность

### Защита токенов
- JWT токены хранятся в localStorage
- Автоматическое обновление токенов
- Очистка токенов при выходе

### Валидация данных
- Валидация на стороне клиента
- Санитизация пользовательского ввода
- Защита от XSS атак

## Развертывание

### Сборка для production
```bash
npm run build
```

### Переменные окружения для production
```env
REACT_APP_API_URL=https://api.literature-committee.com
NODE_ENV=production
```

## Поддержка и обслуживание

### Обновление зависимостей
```bash
npm audit
npm update
```

### Мониторинг ошибок
- Интеграция с системами мониторинга (Sentry, LogRocket)
- Автоматические уведомления об ошибках
- Аналитика использования API