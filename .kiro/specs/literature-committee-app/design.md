# Документ дизайна

## Обзор

Веб-приложение для литературного комитета представляет собой систему управления заказами и распределением литературы с трехуровневой иерархией (группа → местность → регион). Система построена на современном веб-стеке с акцентом на масштабируемость и расширяемость.

## Архитектура

### Общая архитектура

Система использует трехуровневую архитектуру:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│     Layer       │◄──►│     Layer       │◄──►│     Layer       │
│   (React.js)    │    │  (Node.js API)  │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Технологический стек

**Frontend:**
- React.js 18+ с TypeScript
- Material-UI для компонентов интерфейса
- React Router для навигации
- Axios для HTTP запросов
- React Query для кэширования данных

**Backend:**
- Node.js с Express.js
- TypeScript для типизации
- JWT для аутентификации
- Bcrypt для хеширования паролей
- Joi для валидации данных

**База данных:**
- PostgreSQL 14+
- Prisma ORM для работы с БД
- Redis для кэширования сессий

**Инфраструктура:**
- Docker для контейнеризации
- Nginx как reverse proxy
- PM2 для управления процессами Node.js

## Компоненты и интерфейсы

### Frontend компоненты

#### 1. Модуль аутентификации
- `LoginForm` - форма входа в систему
- `AuthGuard` - защита маршрутов
- `UserProfile` - профиль пользователя

#### 2. Модуль управления заказами
- `OrderList` - список заказов
- `OrderForm` - создание/редактирование заказа
- `OrderDetails` - детальная информация о заказе
- `OrderStatus` - компонент статуса заказа

#### 3. Модуль каталога литературы
- `LiteratureCatalog` - каталог литературы
- `LiteratureItem` - карточка литературы
- `LiteratureForm` - добавление/редактирование литературы
- `InventoryStatus` - остатки на складе

#### 4. Модуль отчетности
- `ReportGenerator` - генератор отчетов
- `ReportFilters` - фильтры для отчетов
- `ReportViewer` - просмотр отчетов
- `ExportButtons` - экспорт в различные форматы

#### 5. Модуль администрирования
- `UserManagement` - управление пользователями
- `RoleAssignment` - назначение ролей
- `SystemSettings` - настройки системы

### Backend API эндпоинты

#### Аутентификация
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/profile
```

#### Управление заказами
```
GET    /api/orders              # Получить список заказов
POST   /api/orders              # Создать новый заказ
GET    /api/orders/:id          # Получить заказ по ID
PUT    /api/orders/:id          # Обновить заказ
DELETE /api/orders/:id          # Удалить заказ
PUT    /api/orders/:id/status   # Изменить статус заказа
PUT    /api/orders/:id/lock     # Заблокировать редактирование
PUT    /api/orders/:id/unlock   # Разблокировать редактирование
```

#### Каталог литературы
```
GET    /api/literature          # Получить каталог
POST   /api/literature          # Добавить литературу
GET    /api/literature/:id      # Получить литературу по ID
PUT    /api/literature/:id      # Обновить литературу
DELETE /api/literature/:id      # Удалить литературу
GET    /api/literature/:id/inventory # Остатки на складах
```

#### Отчетность
```
GET /api/reports/movement       # Отчет по движению литературы
GET /api/reports/financial      # Финансовый отчет
GET /api/reports/inventory      # Отчет по остаткам
POST /api/reports/export        # Экспорт отчета
```

#### Управление пользователями
```
GET    /api/users               # Список пользователей
POST   /api/users               # Создать пользователя
GET    /api/users/:id           # Получить пользователя
PUT    /api/users/:id           # Обновить пользователя
DELETE /api/users/:id           # Удалить пользователя
```

## Модели данных

### Основные сущности

#### User (Пользователь)
```typescript
interface User {
  id: string;
  email: string;
  password: string; // хешированный
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  GROUP = 'group',
  LOCAL_SUBCOMMITTEE = 'local_subcommittee',
  LOCALITY = 'locality', 
  REGION = 'region',
  ADMIN = 'admin'
}
```

#### Organization (Организация)
```typescript
interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  parentId?: string; // для иерархии
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum OrganizationType {
  GROUP = 'group',
  LOCAL_SUBCOMMITTEE = 'local_subcommittee',
  LOCALITY = 'locality',
  REGION = 'region'
}
```

#### Literature (Литература)
```typescript
interface Literature {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Order (Заказ)
```typescript
interface Order {
  id: string;
  orderNumber: string;
  fromOrganizationId: string;
  toOrganizationId: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  isEditable: boolean;      // вычисляемое поле на основе статуса
  lockedAt?: Date;          // время блокировки редактирования
  lockedBy?: string;        // кто заблокировал редактирование
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

enum OrderStatus {
  DRAFT = 'draft',           // черновик - можно редактировать
  PENDING = 'pending',       // отправлен - можно редактировать
  APPROVED = 'approved',     // одобрен - можно редактировать
  IN_ASSEMBLY = 'in_assembly', // в сборке - редактирование заблокировано
  SHIPPED = 'shipped',       // отгружен
  DELIVERED = 'delivered',   // доставлен
  COMPLETED = 'completed',   // завершен
  REJECTED = 'rejected'      // отклонен
}
```

#### OrderItem (Позиция заказа)
```typescript
interface OrderItem {
  id: string;
  orderId: string;
  literatureId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

#### Inventory (Складские остатки)
```typescript
interface Inventory {
  id: string;
  organizationId: string;
  literatureId: string;
  quantity: number;
  reservedQuantity: number;
  lastUpdated: Date;
}
```

#### Transaction (Транзакция движения)
```typescript
interface Transaction {
  id: string;
  type: TransactionType;
  fromOrganizationId?: string;
  toOrganizationId: string;
  literatureId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  orderId?: string;
  notes?: string;
  createdAt: Date;
}

enum TransactionType {
  INCOMING = 'incoming',    // поступление
  OUTGOING = 'outgoing',    // отгрузка
  ADJUSTMENT = 'adjustment' // корректировка
}
```

### Схема базы данных

```mermaid
erDiagram
    User ||--|| Organization : belongs_to
    Organization ||--o{ Organization : parent_child
    Order ||--|| Organization : from
    Order ||--|| Organization : to
    Order ||--o{ OrderItem : contains
    OrderItem ||--|| Literature : references
    Inventory ||--|| Organization : belongs_to
    Inventory ||--|| Literature : tracks
    Transaction ||--|| Literature : involves
    Transaction ||--o| Organization : from
    Transaction ||--|| Organization : to
    Transaction ||--o| Order : related_to
```

## Обработка ошибок

### Бизнес-логика управления заказами

#### Правила редактирования заказов

**Статусы, при которых заказ можно редактировать:**
- `DRAFT` - черновик, полное редактирование
- `PENDING` - отправлен, можно редактировать до одобрения
- `APPROVED` - одобрен, можно редактировать до начала сборки

**Статусы, при которых редактирование заблокировано:**
- `IN_ASSEMBLY` - в сборке, редактирование заблокировано автоматически
- `SHIPPED` - отгружен
- `DELIVERED` - доставлен  
- `COMPLETED` - завершен

**Права на блокировку редактирования:**
- Организация-получатель может заблокировать заказ, переведя его в статус `IN_ASSEMBLY`
- После блокировки заказчик не может вносить изменения
- Разблокировка возможна только организацией-получателем до отгрузки

#### Иерархия организаций и заказов

**Местные подкомитеты:**
- Могут существовать несколько на одной местности
- Имеют те же права заказа, что и группы
- Заказывают литературу у своей местности
- Могут иметь собственные склады (inventory)

**Правила заказов по иерархии:**
- Группы и местные подкомитеты → заказывают у местности
- Местности → заказывают у региона
- Регион → может отправлять напрямую любому уровню (исключительные случаи)

### Стратегия обработки ошибок

#### Frontend
- Глобальный обработчик ошибок через React Error Boundary
- Локальная обработка ошибок в компонентах
- Пользовательские уведомления через toast-сообщения
- Логирование ошибок в консоль браузера

#### Backend
- Централизованная обработка ошибок через middleware
- Структурированные коды ошибок
- Логирование в файлы и внешние системы
- Валидация входных данных на уровне API

### Коды ошибок

```typescript
enum ErrorCode {
  // Аутентификация
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  INVALID_CREDENTIALS = 'AUTH_003',
  
  // Валидация
  VALIDATION_ERROR = 'VAL_001',
  REQUIRED_FIELD = 'VAL_002',
  INVALID_FORMAT = 'VAL_003',
  
  // Бизнес-логика
  INSUFFICIENT_INVENTORY = 'BIZ_001',
  INVALID_ORDER_STATUS = 'BIZ_002',
  ORGANIZATION_HIERARCHY_ERROR = 'BIZ_003',
  ORDER_LOCKED_FOR_EDITING = 'BIZ_004',
  INVALID_STATUS_TRANSITION = 'BIZ_005',
  
  // Система
  DATABASE_ERROR = 'SYS_001',
  EXTERNAL_SERVICE_ERROR = 'SYS_002',
  INTERNAL_SERVER_ERROR = 'SYS_003'
}
```

## Стратегия тестирования

### Frontend тестирование
- **Unit тесты**: Jest + React Testing Library для компонентов
- **Integration тесты**: тестирование взаимодействия компонентов
- **E2E тесты**: Cypress для критических пользовательских сценариев

### Backend тестирование
- **Unit тесты**: Jest для бизнес-логики и утилит
- **Integration тесты**: тестирование API эндпоинтов
- **Database тесты**: тестирование с тестовой БД

### Покрытие тестами
- Минимальное покрытие: 80%
- Критические модули: 95%
- Обязательное тестирование всех API эндпоинтов

### Тестовые данные
- Фикстуры для различных сценариев
- Моки для внешних сервисов
- Автоматическая очистка тестовых данных

### CI/CD Pipeline
```yaml
stages:
  - lint: ESLint, Prettier
  - test: Unit и Integration тесты
  - build: Сборка приложения
  - e2e: End-to-end тесты
  - deploy: Развертывание
```

Система спроектирована с учетом требований масштабируемости и возможности добавления новых модулей, таких как функционал для казначеев, без значительных изменений в существующей архитектуре.