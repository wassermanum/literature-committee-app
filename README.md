# Литературный комитет

Веб-приложение для управления заказами и распределением литературы региональной структуры обслуживания Сибирь сообщества Анонимные Наркоманы.

## Технологический стек

### Frontend
- React.js 18+ с TypeScript
- Material-UI для компонентов интерфейса
- React Router для навигации
- React Query для кэширования данных
- Vite для сборки

### Backend
- Node.js с Express.js
- TypeScript
- PostgreSQL с Prisma ORM
- Redis для кэширования
- JWT для аутентификации

## Быстрый старт

### Предварительные требования
- Node.js 18+
- npm 9+
- Docker и Docker Compose (для разработки)

### Установка зависимостей

```bash
# Установка зависимостей для всего проекта
npm install

# Установка зависимостей для frontend
cd frontend && npm install

# Установка зависимостей для backend
cd ../backend && npm install
```

### Запуск с Docker (рекомендуется)

```bash
# Запуск всех сервисов в режиме разработки
npm run docker:dev
```

Это запустит:
- PostgreSQL на порту 5432
- Redis на порту 6379
- Backend API на порту 5000
- Frontend на порту 3000

### Запуск без Docker

1. Настройте базу данных PostgreSQL и Redis
2. Скопируйте `.env.example` в `.env` в папке backend и настройте переменные
3. Запустите миграции базы данных:
   ```bash
   cd backend && npm run db:migrate
   ```
4. Запустите приложение:
   ```bash
   npm run dev
   ```

## Доступные скрипты

### Корневой уровень
- `npm run dev` - запуск frontend и backend в режиме разработки
- `npm run build` - сборка проекта для продакшена
- `npm run test` - запуск всех тестов
- `npm run lint` - проверка кода линтером
- `npm run format` - форматирование кода с Prettier

### Backend
- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка TypeScript
- `npm run start` - запуск собранного приложения
- `npm run db:migrate` - применение миграций БД
- `npm run db:seed` - заполнение БД тестовыми данными
- `npm run db:studio` - открытие Prisma Studio

### Frontend
- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка для продакшена
- `npm run preview` - предварительный просмотр сборки

## Структура проекта

```
literature-committee-app/
├── frontend/                 # React приложение
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── hooks/          # Пользовательские хуки
│   │   ├── services/       # API сервисы
│   │   ├── types/          # TypeScript типы
│   │   ├── utils/          # Утилиты
│   │   └── theme/          # Тема Material-UI
│   └── package.json
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/    # Контроллеры
│   │   ├── services/       # Бизнес-логика
│   │   ├── middleware/     # Middleware
│   │   ├── routes/         # Маршруты API
│   │   ├── types/          # TypeScript типы
│   │   ├── utils/          # Утилиты
│   │   └── config/         # Конфигурация
│   └── package.json
├── docker-compose.dev.yml   # Docker конфигурация для разработки
└── package.json            # Корневой package.json
```

## Разработка

Проект использует монорепозиторий с workspaces. Все команды можно запускать из корневой директории.

### Линтинг и форматирование
- ESLint настроен для TypeScript
- Prettier для форматирования кода
- Запуск: `npm run lint` и `npm run format`

### Тестирование
- Jest для unit тестов
- React Testing Library для тестирования компонентов
- Supertest для тестирования API

## API

Backend API доступен по адресу `http://localhost:5000/api`

Проверка работы: `GET /api/health`

## База данных

Используется PostgreSQL с Prisma ORM. Схема базы данных будет создана в следующих задачах.

## Лицензия

Частный проект для сообщества Анонимные Наркоманы.