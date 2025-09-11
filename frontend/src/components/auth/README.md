# Компоненты аутентификации

Этот модуль содержит компоненты для работы с аутентификацией и авторизацией пользователей в системе литературного комитета.

## Компоненты

### LoginForm

Компонент формы входа в систему с валидацией полей.

**Особенности:**
- Валидация email и пароля с помощью Yup
- Показ/скрытие пароля
- Обработка ошибок входа
- Интеграция с React Hook Form
- Адаптивный дизайн с градиентами

**Использование:**
```tsx
import { LoginForm } from './components/auth/LoginForm';

<LoginForm onSuccess={() => navigate('/dashboard')} />
```

### AuthGuard

Компонент для защиты маршрутов с проверкой аутентификации и ролей.

**Особенности:**
- Проверка аутентификации пользователя
- Проверка ролей доступа
- Автоматическое перенаправление на страницу входа
- Показ сообщений об ошибках доступа

**Использование:**
```tsx
import { AuthGuard } from './components/auth/AuthGuard';
import { UserRole } from './types/auth';

// Базовая защита
<AuthGuard>
  <ProtectedComponent />
</AuthGuard>

// Защита с проверкой ролей
<AuthGuard requiredRoles={[UserRole.ADMIN, UserRole.REGION]}>
  <AdminComponent />
</AuthGuard>
```

### RoleGuard

Компонент для условного отображения контента на основе ролей пользователя.

**Использование:**
```tsx
import { RoleGuard } from './components/auth/AuthGuard';

<RoleGuard allowedRoles={[UserRole.ADMIN]}>
  <AdminOnlyButton />
</RoleGuard>
```

### UserProfile

Компонент для отображения профиля пользователя.

**Особенности:**
- Полная и компактная версии
- Отображение информации о пользователе
- Кнопка выхода из системы
- Диалог подтверждения выхода

**Использование:**
```tsx
import { UserProfile } from './components/auth/UserProfile';

// Полная версия
<UserProfile />

// Компактная версия
<UserProfile compact />

// Без кнопки выхода
<UserProfile showLogoutButton={false} />
```

## Контекст аутентификации

### AuthProvider

Провайдер контекста для управления состоянием аутентификации.

**Особенности:**
- Управление состоянием пользователя
- Автоматическая проверка токенов
- Обновление токенов
- Обработка ошибок аутентификации

### useAuth

Хук для использования контекста аутентификации.

**Использование:**
```tsx
import { useAuth } from './contexts/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();
```

## Сервисы

### authService

Сервис для работы с API аутентификации.

**Методы:**
- `login(credentials)` - вход в систему
- `logout()` - выход из системы
- `refreshToken()` - обновление токена
- `getProfile()` - получение профиля пользователя

## Типы

### UserRole

Перечисление ролей пользователей:
- `GROUP` - Группа
- `LOCAL_SUBCOMMITTEE` - Местный подкомитет
- `LOCALITY` - Местность
- `REGION` - Регион
- `ADMIN` - Администратор

### User

Интерфейс пользователя с полной информацией.

### LoginCredentials

Интерфейс для данных входа (email, password).

### AuthResponse

Интерфейс ответа API при успешной аутентификации.

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

## Безопасность

- Токены хранятся в localStorage
- Автоматическое обновление токенов
- Очистка данных при выходе
- Защита от XSS через валидацию
- Интерцепторы для обработки ошибок 401