# End-to-End тестирование системы "Литературный Комитет"

## Обзор

Данный документ описывает комплексную систему E2E тестирования, которая проверяет все критические пользовательские сценарии системы управления литературой.

## Структура тестов

### Основные тестовые сценарии

1. **Аутентификация и авторизация** (`auth.spec.ts`)
   - Вход пользователей с разными ролями
   - Проверка прав доступа
   - Выход из системы
   - Обработка ошибок входа

2. **Жизненный цикл заказа** (`order-lifecycle.spec.ts`)
   - Создание заказа группой
   - Обработка заказа местностью
   - Изменение статусов заказа
   - Блокировка/разблокировка редактирования
   - Завершение заказа

3. **Управление каталогом литературы** (`literature-management.spec.ts`)
   - Просмотр каталога
   - Добавление/редактирование литературы
   - Поиск и фильтрация
   - Управление остатками

4. **Система отчетности** (`reports.spec.ts`)
   - Генерация различных типов отчетов
   - Экспорт в PDF и Excel
   - Фильтрация и настройка отчетов
   - Сохранение настроек

5. **Административные функции** (`admin-functions.spec.ts`)
   - Управление пользователями
   - Управление организациями
   - Системные настройки
   - Мониторинг и логи

6. **Система уведомлений** (`notifications.spec.ts`)
   - Уведомления о заказах
   - Уведомления о низких остатках
   - Email уведомления
   - Настройки уведомлений

7. **Полная интеграция** (`full-integration.spec.ts`)
   - Комплексные сценарии от создания пользователя до завершения заказа
   - Тестирование производительности
   - Обработка ошибок
   - Тестирование безопасности

## Настройка и запуск

### Предварительные требования

1. **Node.js** версии 18 или выше
2. **Playwright** установлен и настроен
3. **Backend и Frontend** запущены локально
4. **База данных** с тестовыми данными

### Установка зависимостей

```bash
# Установка Playwright
npm install @playwright/test playwright

# Установка браузеров
npx playwright install
```

### Конфигурация

Основная конфигурация находится в файле `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),
  fullyParallel: false,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    { command: 'npm run dev:backend', port: 3000 },
    { command: 'npm run dev:frontend', port: 5173 },
  ],
});
```

### Запуск тестов

```bash
# Запуск всех E2E тестов
npm run test:e2e

# Запуск с UI интерфейсом
npm run test:e2e:ui

# Запуск в режиме отладки
npm run test:e2e:debug

# Запуск конкретного теста
npx playwright test auth.spec.ts

# Запуск в headed режиме (с видимым браузером)
npm run test:e2e:headed
```

### Запуск в CI/CD

```bash
# Для CI окружения
CI=true npm run test:e2e
```

## Тестовые данные

### Пользователи

Система использует предопределенных тестовых пользователей:

```typescript
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin'
  },
  regionUser: {
    email: 'region@test.com',
    password: 'region123',
    role: 'region'
  },
  localityUser: {
    email: 'locality@test.com',
    password: 'locality123',
    role: 'locality'
  },
  groupUser: {
    email: 'group@test.com',
    password: 'group123',
    role: 'group'
  }
};
```

### Организации

Тестовая иерархия организаций:
- **Тестовый Регион Сибирь** (регион)
  - **Тестовая Местность Новосибирск** (местность)
    - **Тестовая Группа Надежда** (группа)

### Литература

Базовый набор тестовой литературы:
- Базовый текст (150.00 руб.)
- Информационные брошюры (50.00 руб.)
- Рабочие тетради (200.00 руб.)

## Вспомогательные классы

### AuthHelper

Класс для работы с аутентификацией:

```typescript
const authHelper = new AuthHelper(page);

// Вход в систему
await authHelper.login('admin');

// Выход из системы
await authHelper.logout();

// Проверка роли пользователя
await authHelper.expectUserRole('Администратор');

// Проверка доступа к странице
await authHelper.expectAccessToPage('/admin', true);
```

### OrderHelper

Класс для работы с заказами:

```typescript
const orderHelper = new OrderHelper(page);

// Создание заказа
const orderNumber = await orderHelper.createOrder({
  toOrganization: 'Тестовая Местность Новосибирск',
  items: [
    { literature: 'Базовый текст', quantity: 5 }
  ],
  notes: 'Тестовый заказ'
});

// Изменение статуса заказа
await orderHelper.changeOrderStatus(orderNumber, 'APPROVED');

// Проверка статуса заказа
await orderHelper.expectOrderStatus(orderNumber, 'APPROVED');
```

### NotificationHelper

Класс для работы с уведомлениями:

```typescript
const notificationHelper = new NotificationHelper(page);

// Проверка уведомления
await notificationHelper.expectNotification('Заказ создан', 'success');

// Проверка системного уведомления
await notificationHelper.expectSystemNotification('new-order');
```

## Отчеты и результаты

### HTML отчет

После выполнения тестов автоматически генерируется HTML отчет:

```bash
# Просмотр отчета
npx playwright show-report
```

### Артефакты тестирования

При падении тестов сохраняются:
- **Скриншоты** - изображения страницы на момент ошибки
- **Видео** - запись выполнения теста
- **Трейсы** - детальная информация о действиях

### JSON и JUnit отчеты

Для интеграции с CI/CD системами генерируются:
- `test-results/results.json` - JSON отчет
- `test-results/results.xml` - JUnit XML отчет

## Лучшие практики

### Селекторы

Используйте `data-testid` атрибуты для стабильных селекторов:

```html
<button data-testid="create-order-button">Создать заказ</button>
```

```typescript
await page.click('[data-testid="create-order-button"]');
```

### Ожидания

Всегда используйте явные ожидания:

```typescript
// Правильно
await expect(page.locator('[data-testid="order-list"]')).toBeVisible();

// Неправильно
await page.waitForTimeout(1000);
```

### Изоляция тестов

Каждый тест должен быть независимым:

```typescript
test.beforeEach(async ({ page }) => {
  // Подготовка данных для каждого теста
  await setupTestData();
});

test.afterEach(async ({ page }) => {
  // Очистка после каждого теста
  await cleanupTestData();
});
```

### Обработка ошибок

Предусматривайте обработку различных сценариев:

```typescript
test('Обработка сетевых ошибок', async ({ page }) => {
  // Имитация сетевой ошибки
  await page.route('**/api/**', route => route.abort());
  
  await page.goto('/orders');
  
  // Проверка отображения ошибки
  await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
});
```

## Отладка тестов

### Режим отладки

```bash
# Запуск в режиме отладки
npx playwright test --debug auth.spec.ts
```

### Пошаговое выполнение

```typescript
test('Отладка теста', async ({ page }) => {
  await page.pause(); // Пауза для отладки
  
  await page.goto('/login');
  // ... остальной код теста
});
```

### Логирование

```typescript
test('Тест с логированием', async ({ page }) => {
  // Включение логирования консоли
  page.on('console', msg => console.log(msg.text()));
  
  await page.goto('/orders');
});
```

## Интеграция с CI/CD

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app
COPY . .
RUN npm ci
RUN npx playwright install

CMD ["npm", "run", "test:e2e"]
```

## Мониторинг и метрики

### Производительность тестов

Отслеживайте время выполнения тестов:

```typescript
test('Производительность загрузки страницы', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/orders');
  await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(5000); // Не более 5 секунд
});
```

### Покрытие тестами

Убедитесь, что покрыты все критические сценарии:
- ✅ Аутентификация всех ролей
- ✅ Полный жизненный цикл заказа
- ✅ Управление каталогом
- ✅ Генерация отчетов
- ✅ Административные функции
- ✅ Система уведомлений
- ✅ Обработка ошибок

## Устранение неполадок

### Частые проблемы

1. **Тесты падают из-за таймаутов**
   - Увеличьте таймауты в конфигурации
   - Проверьте производительность системы

2. **Нестабильные селекторы**
   - Используйте `data-testid` атрибуты
   - Избегайте CSS селекторов, зависящих от стилей

3. **Проблемы с тестовыми данными**
   - Убедитесь, что глобальная настройка выполняется корректно
   - Проверьте изоляцию тестов

4. **Ошибки в CI/CD**
   - Проверьте версии браузеров
   - Убедитесь, что все зависимости установлены

### Логи и диагностика

```bash
# Подробные логи
DEBUG=pw:api npm run test:e2e

# Логи браузера
npx playwright test --reporter=line --verbose
```

## Заключение

Данная система E2E тестирования обеспечивает:

- **Полное покрытие** критических пользовательских сценариев
- **Автоматическую проверку** всех основных функций системы
- **Раннее обнаружение** регрессий и ошибок
- **Документирование** ожидаемого поведения системы
- **Уверенность** в качестве релизов

Регулярное выполнение E2E тестов гарантирует стабильность и надежность системы управления литературой для всех пользователей.