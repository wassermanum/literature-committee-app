# Административные компоненты

Этот модуль содержит компоненты для административного управления системой литературного комитета.

## Компоненты

### AdminDashboard
Основная панель администратора с обзором системы и навигацией по разделам.

**Возможности:**
- Обзор статистики системы (пользователи, организации, активность)
- Распределение пользователей по ролям
- Распределение организаций по типам
- Недавняя активность в системе
- Навигация по административным разделам через вкладки

**Вкладки:**
1. **Обзор** - общая статистика и активность
2. **Пользователи** - управление пользователями
3. **Права доступа** - настройка ролей и прав
4. **Настройки** - системные настройки

### UserManagement
Компонент для управления пользователями системы.

**Возможности:**
- Просмотр списка пользователей с фильтрацией
- Создание новых пользователей
- Редактирование существующих пользователей
- Удаление пользователей (с подтверждением)
- Сброс паролей пользователей
- Фильтрация по роли, организации, статусу
- Поиск по имени и email
- Пагинация результатов
- Экспорт и импорт пользователей (TODO)

**Пропсы:**
- `organizations: Organization[]` - список организаций для выбора

**Функции:**
- Валидация форм с помощью Formik и Yup
- Контекстное меню для действий с пользователями
- Цветовая индикация ролей и статусов

### RoleAssignment
Компонент для управления правами доступа ролей.

**Возможности:**
- Просмотр и редактирование прав доступа по ролям
- Группировка прав по ресурсам и действиям
- Матричное представление прав доступа
- Описание ролей и их назначения
- Переключение прав в реальном времени
- Сворачиваемые секции для удобства навигации

**Структура прав:**
- **Ресурсы**: пользователи, организации, литература, заказы, отчеты, остатки, настройки
- **Действия**: создание, просмотр, редактирование, удаление, экспорт, импорт, управление
- **Роли**: группа, местный подкомитет, местность, регион, администратор

### SystemSettings
Компонент для управления системными настройками.

**Возможности:**
- Просмотр и редактирование системных настроек
- Группировка настроек по категориям
- Поддержка различных типов данных (string, number, boolean, json)
- Валидация и сохранение настроек
- Информация о последнем изменении настроек
- Защита от редактирования критических настроек

**Категории настроек:**
- **Общие** - основные параметры системы
- **Безопасность** - настройки аутентификации и безопасности
- **Уведомления** - конфигурация уведомлений
- **Хранилище** - настройки файлового хранилища
- **Email** - конфигурация почтовых уведомлений

## Хуки

### useUsers
Хук для работы с пользователями.

**Возможности:**
- Загрузка списка пользователей с пагинацией и фильтрацией
- CRUD операции с пользователями
- Сброс паролей
- Управление состоянием загрузки и ошибок

**Методы:**
- `createUser(data)` - создание пользователя
- `updateUser(id, data)` - обновление пользователя
- `deleteUser(id)` - удаление пользователя
- `resetPassword(id, password)` - сброс пароля
- `updateFilters(filters)` - обновление фильтров
- `updatePage(page)` - изменение страницы

### useOrganizations
Хук для работы с организациями.

**Возможности:**
- Загрузка списка организаций с пагинацией и фильтрацией
- CRUD операции с организациями
- Управление иерархией организаций

**Методы:**
- `createOrganization(data)` - создание организации
- `updateOrganization(id, data)` - обновление организации
- `deleteOrganization(id)` - удаление организации

### useSystemSettings
Хук для работы с системными настройками.

**Возможности:**
- Загрузка системных настроек
- Обновление настроек
- Управление состоянием

**Методы:**
- `updateSetting(key, data)` - обновление настройки
- `refetch()` - перезагрузка настроек

### useAdminStats
Хук для получения административной статистики.

**Возможности:**
- Загрузка общей статистики системы
- Информация о пользователях и организациях
- Недавняя активность

### useRolePermissions
Хук для работы с правами доступа.

**Возможности:**
- Загрузка прав доступа по ролям
- Обновление прав доступа
- Управление состоянием

**Методы:**
- `updatePermission(id, data)` - обновление права доступа

## Типы данных

### User (расширенный)
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Organization
```typescript
interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  parentId?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### SystemSettings
```typescript
interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  isEditable: boolean;
  updatedAt: string;
  updatedBy: string;
}
```

### RolePermission
```typescript
interface RolePermission {
  id: string;
  role: UserRole;
  resource: string;
  action: string;
  allowed: boolean;
}
```

### AdminStats
```typescript
interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  activeOrganizations: number;
  usersByRole: Record<UserRole, number>;
  organizationsByType: Record<OrganizationType, number>;
  recentActivity: Array<{
    date: string;
    action: string;
    user: string;
    target: string;
  }>;
}
```

## Сервисы

### adminService
Сервис для взаимодействия с административным API:

**Управление пользователями:**
- `getUsers(page, limit, filters)` - получение списка пользователей
- `getUserById(id)` - получение пользователя по ID
- `createUser(data)` - создание пользователя
- `updateUser(id, data)` - обновление пользователя
- `deleteUser(id)` - удаление пользователя
- `resetUserPassword(id, password)` - сброс пароля

**Управление организациями:**
- `getOrganizations(page, limit, filters)` - получение списка организаций
- `getOrganizationById(id)` - получение организации по ID
- `createOrganization(data)` - создание организации
- `updateOrganization(id, data)` - обновление организации
- `deleteOrganization(id)` - удаление организации
- `getOrganizationHierarchy()` - получение иерархии организаций

**Системные настройки:**
- `getSystemSettings()` - получение настроек
- `updateSystemSetting(key, data)` - обновление настройки

**Права доступа:**
- `getRolePermissions()` - получение прав доступа
- `updateRolePermission(id, data)` - обновление права доступа

**Статистика:**
- `getAdminStats()` - получение статистики

**Импорт/экспорт:**
- `exportUsers(format)` - экспорт пользователей
- `exportOrganizations(format)` - экспорт организаций
- `importUsers(file)` - импорт пользователей
- `importOrganizations(file)` - импорт организаций

## API эндпоинты

Компоненты работают со следующими API эндпоинтами:

```
# Пользователи
GET    /api/users               # Список пользователей
POST   /api/users               # Создать пользователя
GET    /api/users/:id           # Получить пользователя
PUT    /api/users/:id           # Обновить пользователя
DELETE /api/users/:id           # Удалить пользователя
POST   /api/users/:id/reset-password # Сброс пароля

# Организации
GET    /api/organizations       # Список организаций
POST   /api/organizations       # Создать организацию
GET    /api/organizations/:id   # Получить организацию
PUT    /api/organizations/:id   # Обновить организацию
DELETE /api/organizations/:id   # Удалить организацию
GET    /api/organizations/hierarchy # Иерархия организаций

# Администрирование
GET    /api/admin/stats         # Статистика
GET    /api/admin/settings      # Системные настройки
PUT    /api/admin/settings/:key # Обновить настройку
GET    /api/admin/permissions   # Права доступа
PUT    /api/admin/permissions/:id # Обновить право доступа

# Импорт/экспорт
GET    /api/admin/export/users  # Экспорт пользователей
GET    /api/admin/export/organizations # Экспорт организаций
POST   /api/admin/import/users  # Импорт пользователей
POST   /api/admin/import/organizations # Импорт организаций
```

## Использование

### Базовое использование
```tsx
import { AdminDashboard } from '../components/admin';

function AdminPage() {
  return (
    <div>
      <AdminDashboard />
    </div>
  );
}
```

### Отдельные компоненты
```tsx
import { UserManagement, RoleAssignment } from '../components/admin';
import { useOrganizations } from '../hooks/useAdmin';

function CustomAdminPanel() {
  const { organizations } = useOrganizations();

  return (
    <div>
      <UserManagement organizations={organizations} />
      <RoleAssignment />
    </div>
  );
}
```

## Права доступа

### Доступ к административным функциям
- **Полный доступ**: только роль ADMIN
- **Ограниченный доступ**: роль REGION (только просмотр некоторых разделов)
- **Запрещен доступ**: роли GROUP, LOCAL_SUBCOMMITTEE, LOCALITY

### Матрица прав по умолчанию

| Ресурс/Действие | GROUP | LOCAL_SUB | LOCALITY | REGION | ADMIN |
|------------------|-------|-----------|----------|--------|-------|
| Пользователи     | -     | -         | -        | Просмотр | Полный |
| Организации      | -     | -         | -        | Просмотр | Полный |
| Настройки        | -     | -         | -        | -      | Полный |
| Права доступа    | -     | -         | -        | -      | Полный |

## Безопасность

1. **Валидация данных**: все формы проходят валидацию на клиенте и сервере
2. **Подтверждение действий**: критические операции требуют подтверждения
3. **Аудит изменений**: все изменения логируются с указанием пользователя
4. **Защита настроек**: критические настройки защищены от случайного изменения
5. **Проверка прав**: все операции проверяются на уровне API

## Особенности

1. **Адаптивный дизайн**: все компоненты работают на различных устройствах
2. **Реальное время**: изменения прав доступа применяются немедленно
3. **Пагинация**: большие списки разбиваются на страницы
4. **Фильтрация**: мощные возможности поиска и фильтрации
5. **Экспорт/импорт**: массовые операции с данными
6. **Валидация**: комплексная проверка данных перед сохранением