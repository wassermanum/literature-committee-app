import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';
import { OrderHelper } from './utils/order-helpers';
import { NotificationHelper } from './utils/notification-helpers';

test.describe('Полная интеграция системы', () => {
  let authHelper: AuthHelper;
  let orderHelper: OrderHelper;
  let notificationHelper: NotificationHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    orderHelper = new OrderHelper(page);
    notificationHelper = new NotificationHelper(page);
  });

  test('Полный сценарий: от создания пользователя до завершения заказа с отчетностью', async ({ page }) => {
    // Этап 1: Администратор создает новую организацию и пользователя
    await authHelper.login('admin');
    
    // Создаем новую группу
    await page.goto('/admin/organizations');
    await page.click('[data-testid="create-organization-button"]');
    
    await page.fill('[data-testid="name-input"]', 'Интеграционная Тестовая Группа');
    await page.selectOption('[data-testid="type-select"]', 'group');
    await page.selectOption('[data-testid="parent-select"]', 'Тестовая Местность Новосибирск');
    await page.fill('[data-testid="address-input"]', 'г. Новосибирск, ул. Интеграционная, 1');
    await page.fill('[data-testid="contact-person-input"]', 'Интегратор И.И.');
    await page.fill('[data-testid="phone-input"]', '+7-999-888-77-66');
    await page.fill('[data-testid="email-input"]', 'integration@test.com');
    
    await page.click('[data-testid="save-organization-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Создаем пользователя для новой группы
    await page.goto('/admin/users');
    await page.click('[data-testid="create-user-button"]');
    
    await page.fill('[data-testid="email-input"]', 'integration-user@test.com');
    await page.fill('[data-testid="password-input"]', 'integration123');
    await page.fill('[data-testid="confirm-password-input"]', 'integration123');
    await page.fill('[data-testid="first-name-input"]', 'Интеграционный');
    await page.fill('[data-testid="last-name-input"]', 'Пользователь');
    await page.selectOption('[data-testid="role-select"]', 'group');
    await page.selectOption('[data-testid="organization-select"]', 'Интеграционная Тестовая Группа');
    
    await page.click('[data-testid="save-user-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Добавляем новую литературу в каталог
    await page.goto('/literature');
    await page.click('[data-testid="add-literature-button"]');
    
    await page.fill('[data-testid="title-input"]', 'Интеграционная литература');
    await page.fill('[data-testid="description-input"]', 'Специальная литература для интеграционного тестирования');
    await page.selectOption('[data-testid="category-select"]', 'Тестовая категория');
    await page.fill('[data-testid="price-input"]', '99.99');
    
    await page.click('[data-testid="save-literature-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Настраиваем остатки на складах
    await page.goto('/admin/inventory');
    await page.click('[data-testid="add-inventory-button"]');
    
    await page.selectOption('[data-testid="literature-select"]', 'Интеграционная литература');
    await page.selectOption('[data-testid="organization-select"]', 'Тестовая Местность Новосибирск');
    await page.fill('[data-testid="quantity-input"]', '50');
    
    await page.click('[data-testid="save-inventory-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    await authHelper.logout();

    // Этап 2: Новый пользователь входит в систему и создает заказ
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'integration-user@test.com');
    await page.fill('[data-testid="password-input"]', 'integration123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Проверяем доступ к каталогу литературы
    await page.goto('/literature');
    await expect(page.locator('[data-testid="literature-item-Интеграционная литература"]')).toBeVisible();
    
    // Создаем заказ
    const orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Интеграционная литература', quantity: 5 },
        { literature: 'Базовый текст', quantity: 2 }
      ],
      notes: 'Интеграционный тестовый заказ'
    });

    // Отправляем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    await notificationHelper.expectNotification('Заказ отправлен', 'success');
    
    await authHelper.logout();

    // Этап 3: Местность обрабатывает заказ
    await authHelper.login('localityUser');
    
    // Проверяем получение уведомления о новом заказе
    await notificationHelper.expectSystemNotification('new-order');
    
    // Находим и обрабатываем заказ
    await page.goto('/orders');
    await expect(page.locator(`[data-testid="order-${orderNumber}"]`)).toBeVisible();
    
    // Одобряем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'APPROVED');
    await notificationHelper.expectNotification('Заказ одобрен', 'success');
    
    // Переводим в сборку
    await orderHelper.changeOrderStatus(orderNumber, 'IN_ASSEMBLY');
    
    // Проверяем, что редактирование заблокировано
    await orderHelper.expectOrderEditable(orderNumber, false);
    
    // Отгружаем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'SHIPPED');
    await notificationHelper.expectNotification('Заказ отгружен', 'success');
    
    await authHelper.logout();

    // Этап 4: Группа подтверждает получение
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'integration-user@test.com');
    await page.fill('[data-testid="password-input"]', 'integration123');
    await page.click('[data-testid="login-button"]');
    
    // Проверяем уведомления о статусах заказа
    await notificationHelper.expectSystemNotification('order-shipped');
    
    // Подтверждаем доставку
    await orderHelper.changeOrderStatus(orderNumber, 'DELIVERED');
    await notificationHelper.expectNotification('Заказ доставлен', 'success');
    
    // Завершаем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'COMPLETED');
    await notificationHelper.expectNotification('Заказ завершен', 'success');
    
    await authHelper.logout();

    // Этап 5: Проверяем обновление остатков и транзакции
    await authHelper.login('localityUser');
    
    // Проверяем, что остатки обновились
    await page.goto('/literature');
    await page.click('[data-testid="literature-item-Интеграционная литература"]');
    
    // Остатки должны уменьшиться на 5 единиц
    const currentQuantity = await page.locator('[data-testid="available-quantity"]').textContent();
    expect(parseInt(currentQuantity || '0')).toBe(45); // 50 - 5 = 45
    
    // Проверяем историю транзакций
    await page.goto('/transactions');
    await expect(page.locator(`[data-testid="transaction-order-${orderNumber}"]`)).toBeVisible();
    
    await authHelper.logout();

    // Этап 6: Генерируем отчеты
    await authHelper.login('regionUser');
    
    // Отчет по движению литературы
    await page.goto('/reports');
    await page.selectOption('[data-testid="report-type-select"]', 'movement');
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Проверяем, что наш заказ есть в отчете
    await expect(page.locator(`[data-testid="report-order-${orderNumber}"]`)).toBeVisible();
    
    // Финансовый отчет
    await page.selectOption('[data-testid="report-type-select"]', 'financial');
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Проверяем финансовые данные по нашему заказу
    const totalAmount = 5 * 99.99 + 2 * 150.00; // Интеграционная литература + Базовый текст
    await expect(page.locator('[data-testid="total-income"]')).toContainText(totalAmount.toString());
    
    await authHelper.logout();

    // Этап 7: Администратор проверяет системную статистику
    await authHelper.login('admin');
    
    await page.goto('/admin/statistics');
    
    // Проверяем обновленную статистику
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-orders"]')).toBeVisible();
    
    // Проверяем активность пользователей
    await expect(page.locator('[data-testid="user-activity-integration-user@test.com"]')).toBeVisible();
    
    // Проверяем логи системы
    await page.goto('/admin/logs');
    
    // Должны быть записи о всех операциях
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCountGreaterThan(10);
    
    // Фильтруем логи по нашему заказу
    await page.fill('[data-testid="search-logs-input"]', orderNumber);
    await page.click('[data-testid="search-logs-button"]');
    
    // Проверяем, что есть логи по всем этапам заказа
    await expect(page.locator('[data-testid="log-order-created"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-order-approved"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-order-completed"]')).toBeVisible();
  });

  test('Сценарий с ошибками и их обработкой', async ({ page }) => {
    // Тестируем обработку различных ошибочных ситуаций
    
    // Попытка создания заказа с недостаточными остатками
    await authHelper.login('groupUser');
    
    // Пытаемся заказать больше, чем есть на складе
    await page.goto('/orders');
    await page.click('[data-testid="create-order-button"]');
    
    await page.click('[data-testid="to-organization-select"]');
    await page.click('[data-testid="organization-option-Тестовая Местность Новосибирск"]');
    
    await page.click('[data-testid="add-order-item-button"]');
    await page.click('[data-testid="literature-select"]');
    await page.click('[data-testid="literature-option-Базовый текст"]');
    await page.fill('[data-testid="quantity-input"]', '1000'); // Заведомо большое количество
    
    await page.click('[data-testid="save-order-button"]');
    
    // Проверяем сообщение об ошибке
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Недостаточно остатков');
    
    // Попытка доступа к чужому заказу
    await authHelper.logout();
    await authHelper.login('localityUser');
    
    // Создаем заказ от имени местности
    const orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовый Регион Сибирь',
      items: [
        { literature: 'Базовый текст', quantity: 1 }
      ]
    });

    await authHelper.logout();
    
    // Пытаемся получить доступ к заказу от имени другой организации
    await authHelper.login('groupUser');
    
    await page.goto(`/orders/${orderNumber}`);
    
    // Должна быть ошибка доступа
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    
    // Тестируем обработку сетевых ошибок
    // Имитируем отключение сети
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/orders');
    
    // Проверяем отображение ошибки сети
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Восстанавливаем сеть
    await page.unroute('**/api/**');
    
    // Пытаемся повторить запрос
    await page.click('[data-testid="retry-button"]');
    
    // Проверяем, что данные загрузились
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
  });

  test('Производительность системы при большой нагрузке', async ({ page }) => {
    // Тест производительности с множественными операциями
    
    await authHelper.login('admin');
    
    // Создаем множество организаций
    const organizationCount = 10;
    const startTime = Date.now();
    
    for (let i = 0; i < organizationCount; i++) {
      await page.goto('/admin/organizations');
      await page.click('[data-testid="create-organization-button"]');
      
      await page.fill('[data-testid="name-input"]', `Тестовая Группа ${i}`);
      await page.selectOption('[data-testid="type-select"]', 'group');
      await page.selectOption('[data-testid="parent-select"]', 'Тестовая Местность Новосибирск');
      await page.fill('[data-testid="address-input"]', `Адрес ${i}`);
      await page.fill('[data-testid="contact-person-input"]', `Контакт ${i}`);
      await page.fill('[data-testid="phone-input"]', `+7-999-000-00-${i.toString().padStart(2, '0')}`);
      await page.fill('[data-testid="email-input"]', `group${i}@test.com`);
      
      await page.click('[data-testid="save-organization-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    }
    
    const creationTime = Date.now() - startTime;
    
    // Проверяем, что создание не заняло слишком много времени
    expect(creationTime).toBeLessThan(30000); // Не более 30 секунд
    
    // Проверяем загрузку списка организаций
    await page.goto('/admin/organizations');
    
    const loadStartTime = Date.now();
    await expect(page.locator('[data-testid="organization-row"]')).toHaveCountGreaterThanOrEqual(organizationCount);
    const loadTime = Date.now() - loadStartTime;
    
    // Список должен загружаться быстро
    expect(loadTime).toBeLessThan(5000); // Не более 5 секунд
    
    // Тестируем поиск и фильтрацию
    const searchStartTime = Date.now();
    await page.fill('[data-testid="search-input"]', 'Тестовая Группа 5');
    await page.click('[data-testid="search-button"]');
    
    await expect(page.locator('[data-testid="organization-row"]')).toHaveCount(1);
    const searchTime = Date.now() - searchStartTime;
    
    // Поиск должен быть быстрым
    expect(searchTime).toBeLessThan(2000); // Не более 2 секунд
  });

  test('Безопасность и валидация данных', async ({ page }) => {
    // Тестируем различные аспекты безопасности
    
    await authHelper.login('groupUser');
    
    // Попытка XSS атаки через поля ввода
    await page.goto('/orders');
    await page.click('[data-testid="create-order-button"]');
    
    const xssPayload = '<script>alert("XSS")</script>';
    
    await page.fill('[data-testid="notes-input"]', xssPayload);
    
    // Проверяем, что скрипт не выполняется
    const notesValue = await page.locator('[data-testid="notes-input"]').inputValue();
    expect(notesValue).toBe(xssPayload); // Должен сохраниться как текст
    
    // Попытка SQL инъекции через поиск
    await page.goto('/literature');
    
    const sqlPayload = "'; DROP TABLE literature; --";
    await page.fill('[data-testid="search-input"]', sqlPayload);
    await page.click('[data-testid="search-button"]');
    
    // Система должна обработать это как обычный поиск
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    
    // Проверяем, что каталог все еще работает
    await page.fill('[data-testid="search-input"]', '');
    await page.click('[data-testid="search-button"]');
    await expect(page.locator('[data-testid="literature-item"]')).toHaveCountGreaterThan(0);
    
    // Тестируем валидацию файлов (если есть загрузка)
    await authHelper.logout();
    await authHelper.login('admin');
    
    await page.goto('/admin/settings');
    
    // Попытка загрузки файла неправильного типа
    if (await page.locator('[data-testid="logo-upload"]').isVisible()) {
      // Создаем файл неправильного типа
      const fileContent = 'This is not an image';
      const file = new File([fileContent], 'malicious.exe', { type: 'application/x-msdownload' });
      
      await page.setInputFiles('[data-testid="logo-upload"]', {
        name: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from(fileContent)
      });
      
      // Проверяем сообщение об ошибке
      await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible();
    }
    
    // Тестируем ограничения по размеру данных
    const longString = 'A'.repeat(10000); // Очень длинная строка
    
    await page.goto('/literature');
    await page.click('[data-testid="add-literature-button"]');
    
    await page.fill('[data-testid="title-input"]', longString);
    await page.click('[data-testid="save-literature-button"]');
    
    // Проверяем валидацию длины
    await expect(page.locator('[data-testid="title-length-error"]')).toBeVisible();
  });
});