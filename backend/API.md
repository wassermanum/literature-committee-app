# API Документация - Система аутентификации

## Базовый URL
```
http://localhost:5000/api
```

## Эндпоинты аутентификации

### POST /auth/register
Регистрация нового пользователя

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Имя",
  "lastName": "Фамилия",
  "role": "GROUP|LOCAL_SUBCOMMITTEE|LOCALITY|REGION|ADMIN",
  "organizationId": "id-организации"
}
```

**Ответ (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "Имя",
      "lastName": "Фамилия",
      "role": "GROUP",
      "organizationId": "org-id"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /auth/login
Вход в систему

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "Имя",
      "lastName": "Фамилия",
      "role": "GROUP",
      "organizationId": "org-id"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### GET /auth/profile
Получение профиля пользователя (требует аутентификации)

**Заголовки:**
```
Authorization: Bearer <access-token>
```

**Ответ (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "Имя",
    "lastName": "Фамилия",
    "role": "GROUP",
    "organizationId": "org-id",
    "organization": {
      "id": "org-id",
      "name": "Название организации",
      "type": "GROUP"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/change-password
Смена пароля (требует аутентификации)

**Заголовки:**
```
Authorization: Bearer <access-token>
```

**Тело запроса:**
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

**Ответ (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### POST /auth/refresh
Обновление access token

**Тело запроса:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Ответ (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

### POST /auth/logout
Выход из системы (требует аутентификации)

**Заголовки:**
```
Authorization: Bearer <access-token>
```

**Ответ (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Коды ошибок

- `400` - Ошибка валидации данных
- `401` - Не авторизован / неверные учетные данные
- `403` - Недостаточно прав доступа
- `404` - Пользователь не найден
- `500` - Внутренняя ошибка сервера

## Тестовые пользователи

После выполнения `npm run db:seed` будут созданы следующие тестовые пользователи (пароль: `password123`):

- `admin@siberia-na.org` (Admin)
- `region@siberia-na.org` (Region)
- `novosibirsk@siberia-na.org` (Locality)
- `tomsk@siberia-na.org` (Locality)
- `central@novosibirsk-na.org` (Local Subcommittee)
- `newlife@groups-na.org` (Group)
- `hope@groups-na.org` (Group)
- `freedom@groups-na.org` (Group)