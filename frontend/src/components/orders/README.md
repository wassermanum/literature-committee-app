# Компоненты управления заказами

Этот модуль содержит компоненты для работы с заказами литературы в системе литературного комитета.

## Компоненты

### OrderList

Компонент для отображения списка заказов с возможностью фильтрации, сортировки и пагинации.

**Особенности:**
- Табличное представление заказов
- Контекстное меню с действиями
- Проверка прав доступа на основе ролей
- Пагинация и изменение количества элементов на странице
- Форматирование валюты и дат
- Индикация заблокированных заказов

**Использование:**
```tsx
import { OrderList } from './components/orders/OrderList';

<OrderList
  orders={orders}
  loading={loading}
  total={total}
  page={page}
  limit={limit}
  onPageChange={handlePageChange}
  onLimitChange={handleLimitChange}
  onViewOrder={handleViewOrder}
  onEditOrder={handleEditOrder}
  onDeleteOrder={handleDeleteOrder}
  onChangeStatus={handleChangeStatus}
  onLockOrder={handleLockOrder}
  onUnlockOrder={handleUnlockOrder}
/>
```

### OrderForm

Компонент формы для создания и редактирования заказов.

**Особенности:**
- Валидация полей с помощью Yup
- Динамическое добавление/удаление позиций заказа
- Автоматический расчет стоимости
- Поддержка режимов создания и редактирования
- Выбор литературы из каталога
- Выбор организации-получателя

**Использование:**
```tsx
import { OrderForm } from './components/orders/OrderForm';

// Создание заказа
<OrderForm
  open={createDialogOpen}
  onClose={() => setCreateDialogOpen(false)}
  onSubmit={handleCreateSubmit}
  organizations={organizations}
  literature={literature}
  mode="create"
/>

// Редактирование заказа
<OrderForm
  open={editDialogOpen}
  onClose={() => setEditDialogOpen(false)}
  onSubmit={handleUpdateSubmit}
  order={selectedOrder}
  organizations={organizations}
  literature={literature}
  mode="edit"
/>
```

### OrderDetails

Компонент для детального просмотра заказа.

**Особенности:**
- Полная информация о заказе
- Информация о заказчике и получателе
- Детали по каждой позиции заказа
- Отображение статуса и блокировки
- Форматирование данных для удобного чтения

**Использование:**
```tsx
import { OrderDetails } from './components/orders/OrderDetails';

<OrderDetails
  open={detailsDialogOpen}
  onClose={() => setDetailsDialogOpen(false)}
  order={selectedOrder}
/>
```

### OrderStatus

Компонент для отображения статуса заказа в виде цветного чипа.

**Особенности:**
- Цветовая индикация статусов
- Иконки для каждого статуса
- Подсказки с описанием статуса
- Поддержка разных размеров
- Возможность скрыть иконку

**Статусы:**
- `DRAFT` - Черновик (серый)
- `PENDING` - Ожидает (оранжевый)
- `APPROVED` - Одобрен (синий)
- `IN_ASSEMBLY` - В сборке (фиолетовый)
- `SHIPPED` - Отгружен (индиго)
- `DELIVERED` - Доставлен (зеленый)
- `COMPLETED` - Завершен (зеленый)
- `REJECTED` - Отклонен (красный)

**Использование:**
```tsx
import { OrderStatus } from './components/orders/OrderStatus';

<OrderStatus status={order.status} />
<OrderStatus status={order.status} size="small" />
<OrderStatus status={order.status} showIcon={false} />
```

### OrderFilters

Компонент для фильтрации списка заказов.

**Особенности:**
- Быстрые фильтры (поиск, статус)
- Расширенные фильтры (даты, организации)
- Сворачиваемый интерфейс
- Индикация активных фильтров
- Очистка всех фильтров

**Использование:**
```tsx
import { OrderFilters } from './components/orders/OrderFilters';

<OrderFilters
  filters={filters}
  onFiltersChange={handleFiltersChange}
  onClearFilters={handleClearFilters}
  organizations={organizations}
/>
```

## Хуки

### useOrders

Хук для работы с API заказов с использованием React Query.

**Методы:**
- `useOrders(filters, page, limit)` - получение списка заказов
- `useOrder(id)` - получение заказа по ID
- `useCreateOrder()` - создание заказа
- `useUpdateOrder()` - обновление заказа
- `useDeleteOrder()` - удаление заказа
- `useUpdateOrderStatus()` - изменение статуса заказа
- `useLockOrder()` - блокировка заказа
- `useUnlockOrder()` - разблокировка заказа

**Использование:**
```tsx
import {
  useOrders,
  useCreateOrder,
  useUpdateOrderStatus,
} from '../hooks/useOrders';

const { data: ordersData, isLoading } = useOrders(filters, page, limit);
const createOrderMutation = useCreateOrder();
const updateStatusMutation = useUpdateOrderStatus();
```

## Сервисы

### ordersService

Сервис для работы с API заказов.

**Методы:**
- `getOrders(filters, page, limit)` - получить список заказов
- `getOrderById(id)` - получить заказ по ID
- `createOrder(orderData)` - создать заказ
- `updateOrder(id, orderData)` - обновить заказ
- `deleteOrder(id)` - удалить заказ
- `updateOrderStatus(id, status)` - изменить статус заказа
- `lockOrder(id)` - заблокировать заказ
- `unlockOrder(id)` - разблокировать заказ

## Типы

### Order

Основной интерфейс заказа с полной информацией.

### OrderItem

Интерфейс позиции заказа.

### OrderStatus

Перечисление статусов заказа.

### OrderFilters

Интерфейс для фильтрации заказов.

### CreateOrderRequest / UpdateOrderRequest

Интерфейсы для создания и обновления заказов.

## Бизнес-логика

### Права доступа

- **Просмотр**: все пользователи могут просматривать заказы своей организации
- **Создание**: пользователи могут создавать заказы у вышестоящих организаций
- **Редактирование**: заказчик и получатель могут редактировать заказ до блокировки
- **Изменение статуса**: только получатель может изменять статус заказа
- **Блокировка**: только получатель может блокировать/разблокировать заказ

### Статусы и переходы

```
DRAFT → PENDING → APPROVED → IN_ASSEMBLY → SHIPPED → DELIVERED → COMPLETED
  ↓         ↓         ↓
REJECTED  REJECTED  REJECTED
```

### Правила редактирования

- Заказ можно редактировать в статусах: DRAFT, PENDING, APPROVED
- Заказ блокируется автоматически при переходе в статус IN_ASSEMBLY
- Заблокированный заказ нельзя редактировать
- Только получатель может блокировать/разблокировать заказ

## Тестирование

Все компоненты покрыты unit-тестами с использованием:
- Jest
- React Testing Library
- @testing-library/user-event

Запуск тестов:
```bash
npm test
npm run test:watch
```

## Интеграция

Компоненты интегрированы в главную страницу заказов (`OrdersPage`) и используют:
- React Query для кэширования данных
- React Hook Form для валидации форм
- Material-UI для UI компонентов
- React Hot Toast для уведомлений