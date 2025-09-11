import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';
import { OrderHelper } from './utils/order-helpers';
import { NotificationHelper } from './utils/notification-helpers';

test.describe('Система уведомлений', () => {
  let authHelper: AuthHelper;
  let orderHelper: OrderHelper;
  let notificationHelper: NotificationHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    orderHelper = new OrderHelper(page);
    notificationHelper = new NotificationHelper(page);
  });

  test('Уведомления при создании заказа', async ({ page }) => {
    // Группа создает заказ
    await authHelper.login('groupUser');
    
    const orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Базовый текст', quantity: 3 }
      ],
      notes: 'Тестовый заказ для проверки уведомлений'
    });

    // Проверяем уведомление о создании заказа
    await notificationHelper.expectNotification('Заказ создан успешно', 'success');
    
    // Отправляем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    
    // Проверяем уведомление об отправке
    await notificationHelper.expectNotification('Заказ отправлен получателю', 'info');
    
    await authHelper.logout();

    // Проверяем, что местность получила уведомление о новом заказе
    await authHelper.login('localityUser');
    
    // Проверяем системное уведомление
    await notificationHelper.expectSystemNotification('new-order');
    
    // Проверяем, что заказ отображается в списке входящих
    await page.goto('/orders');
    await expect(page.locator(`[data-testid="incoming-order-${orderNumber}"]`)).toBeVisible();
  });

  test('Уведомления при изменении статуса заказа', async ({ page }) => {
    // Создаем заказ
    await authHelper.login('groupUser');
    
    const orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Информационные брошюры', quantity: 5 }
      ]
    });

    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    await authHelper.logout();

    // Местность одобряет заказ
    await authHelper.login('localityUser');
    await orderHelper.changeOrderStatus(orderNumber, 'APPROVED');
    
    // Проверяем уведомление об одобрении
    await notificationHelper.expectNotification('Заказ одобрен', 'success');
    
    await authHelper.logout();

    // Группа должна получить уведомление об одобрении
    await authHelper.login('groupUser');
    
    await notificationHelper.expectSystemNotification('order-approved');
    
    await authHelper.logout();

    // Местность переводит заказ в сборку
    await authHelper.login('localityUser');
    await orderHelper.changeOrderStatus(orderNumber, 'IN_ASSEMBLY');
    
    await notificationHelper.expectNotification('Заказ передан в сборку', 'info');
    
    // Отгружает заказ
    await orderHelper.changeOrderStatus(orderNumber, 'SHIPPED');
    
    await notificationHelper.expectNotification('Заказ отгружен', 'success');
    
    await authHelper.logout();

    // Группа получает уведомления о каждом изменении статуса
    await authHelper.login('groupUser');
    
    await notificationHelper.expectSystemNotification('order-in-assembly');
    await notificationHelper.expectSystemNotification('order-shipped');
  });

  test('Уведомления о низких остатках на складе', async ({ page }) => {
    await authHelper.login('admin');
    
    // Настраиваем низкий порог для уведомлений
    await page.goto('/admin/settings');
    await page.fill('[data-testid="low-stock-threshold"]', '5');
    await page.click('[data-testid="save-settings-button"]');
    
    // Переходим к управлению остатками
    await page.goto('/admin/inventory');
    
    // Устанавливаем низкий остаток для тестовой литературы
    await page.click('[data-testid="edit-inventory-Базовый текст"]');
    await page.fill('[data-testid="quantity-input"]', '3'); // Ниже порога
    await page.click('[data-testid="save-inventory-button"]');
    
    // Проверяем уведомление о низком остатке
    await notificationHelper.expectNotification('Низкий остаток: Базовый текст', 'warning');
    
    // Проверяем системное уведомление
    await notificationHelper.expectSystemNotification('low-stock');
    
    await authHelper.logout();

    // Проверяем, что ответственные пользователи получили уведомления
    await authHelper.login('regionUser');
    
    await notificationHelper.expectSystemNotification('low-stock');
    
    await authHelper.logout();

    await authHelper.login('localityUser');
    
    await notificationHelper.expectSystemNotification('low-stock');
  });

  test('Напоминания о просроченных заказах', async ({ page }) => {
    // Создаем заказ и оставляем его в статусе PENDING на длительное время
    await authHelper.login('groupUser');
    
    const orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Рабочие тетради', quantity: 2 }
      ]
    });

    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    
    // Имитируем прошедшее время (в реальной системе это было бы автоматическое задание)
    // Для тестирования можем вызвать API напрямую или использовать тестовые утилиты
    await page.evaluate(() => {
      // Имитируем вызов системы напоминаний
      fetch('/api/notifications/check-overdue-orders', { method: 'POST' });
    });

    await authHelper.logout();

    // Проверяем, что местность получила напоминание
    await authHelper.login('localityUser');
    
    await notificationHelper.expectSystemNotification('overdue-order');
    
    // Проверяем детали напоминания
    await page.click('[data-testid="notifications-bell"]');
    await expect(page.locator('[data-testid="overdue-notification"]')).toContainText(orderNumber);
  });

  test('Email уведомления', async ({ page }) => {
    // Настраиваем email уведомления
    await authHelper.login('admin');
    await page.goto('/admin/settings');
    
    await page.check('[data-testid="email-notifications-enabled"]');
    await page.fill('[data-testid="smtp-server-input"]', 'smtp.test.com');
    await page.fill('[data-testid="smtp-port-input"]', '587');
    await page.fill('[data-testid="smtp-username-input"]', 'test@test.com');
    await page.fill('[data-testid="smtp-password-input"]', 'testpassword');
    
    await page.click('[data-testid="save-settings-button"]');
    
    await authHelper.logout();

    // Создаем заказ, который должен вызвать email уведомление
    await authHelper.login('groupUser');
    
    const orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Базовый текст', quantity: 1 }
      ]
    });

    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    
    // Проверяем индикатор отправки email
    await notificationHelper.expectEmailNotification('locality@test.com', 'Новый заказ');
  });

  test('Настройки уведомлений пользователя', async ({ page }) => {
    await authHelper.login('localityUser');
    
    // Переходим к настройкам профиля
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-settings"]');
    
    // Настраиваем предпочтения уведомлений
    await page.check('[data-testid="email-notifications"]');
    await page.uncheck('[data-testid="sms-notifications"]');
    await page.check('[data-testid="browser-notifications"]');
    
    // Настраиваем типы уведомлений
    await page.check('[data-testid="notify-new-orders"]');
    await page.check('[data-testid="notify-status-changes"]');
    await page.uncheck('[data-testid="notify-low-stock"]');
    
    // Сохраняем настройки
    await page.click('[data-testid="save-notification-settings"]');
    
    // Проверяем успешное сохранение
    await notificationHelper.expectNotification('Настройки уведомлений сохранены', 'success');
  });

  test('История уведомлений', async ({ page }) => {
    await authHelper.login('localityUser');
    
    // Переходим к истории уведомлений
    await page.goto('/notifications/history');
    
    // Проверяем отображение истории
    await expect(page.locator('[data-testid="notification-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-item"]')).toHaveCountGreaterThan(0);
    
    // Фильтрация по типу уведомлений
    await page.selectOption('[data-testid="notification-type-filter"]', 'order-related');
    await page.click('[data-testid="apply-filter-button"]');
    
    // Проверяем фильтрацию
    const notificationTypes = await page.locator('[data-testid="notification-type"]').allTextContents();
    notificationTypes.forEach(type => {
      expect(type).toMatch(/order|заказ/i);
    });
    
    // Отмечаем уведомления как прочитанные
    await page.click('[data-testid="mark-all-read-button"]');
    
    // Проверяем, что уведомления отмечены как прочитанные
    await expect(page.locator('[data-testid="unread-notification"]')).toHaveCount(0);
  });

  test('Браузерные push-уведомления', async ({ page, context }) => {
    // Предоставляем разрешение на уведомления
    await context.grantPermissions(['notifications']);
    
    await authHelper.login('localityUser');
    
    // Включаем браузерные уведомления
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-settings"]');
    await page.check('[data-testid="browser-notifications"]');
    await page.click('[data-testid="save-notification-settings"]');
    
    // Создаем событие, которое должно вызвать push-уведомление
    await authHelper.logout();
    await authHelper.login('groupUser');
    
    const orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Базовый текст', quantity: 1 }
      ]
    });

    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    
    // В реальном тестировании здесь можно было бы проверить
    // получение push-уведомления через API браузера
    // Для демонстрации проверяем индикатор отправки
    await expect(page.locator('[data-testid="push-notification-sent"]')).toBeVisible();
  });

  test('Массовые уведомления администратором', async ({ page }) => {
    await authHelper.login('admin');
    
    // Переходим к отправке массовых уведомлений
    await page.goto('/admin/notifications');
    
    // Создаем массовое уведомление
    await page.click('[data-testid="create-broadcast-button"]');
    
    // Заполняем форму
    await page.fill('[data-testid="subject-input"]', 'Важное системное уведомление');
    await page.fill('[data-testid="message-input"]', 'Уважаемые пользователи, информируем вас о плановых работах в системе.');
    
    // Выбираем получателей
    await page.check('[data-testid="send-to-all-users"]');
    
    // Отправляем уведомление
    await page.click('[data-testid="send-broadcast-button"]');
    
    // Проверяем успешную отправку
    await notificationHelper.expectNotification('Массовое уведомление отправлено', 'success');
    
    await authHelper.logout();

    // Проверяем, что пользователи получили уведомление
    await authHelper.login('groupUser');
    
    await notificationHelper.expectSystemNotification('broadcast');
    
    await page.click('[data-testid="notifications-bell"]');
    await expect(page.locator('[data-testid="broadcast-notification"]')).toContainText('Важное системное уведомление');
  });
});