import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';
import { OrderHelper } from './utils/order-helpers';
import { NotificationHelper } from './utils/notification-helpers';

test.describe('Полный жизненный цикл заказа', () => {
  let authHelper: AuthHelper;
  let orderHelper: OrderHelper;
  let notificationHelper: NotificationHelper;
  let orderNumber: string;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    orderHelper = new OrderHelper(page);
    notificationHelper = new NotificationHelper(page);
  });

  test('Создание заказа группой → одобрение местностью → сборка → отгрузка → доставка', async ({ page }) => {
    // Шаг 1: Группа создает заказ
    await authHelper.login('groupUser');
    
    orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Базовый текст', quantity: 5 },
        { literature: 'Информационные брошюры', quantity: 10 }
      ],
      notes: 'Срочный заказ для новичков'
    });

    // Проверяем начальный статус
    await orderHelper.expectOrderStatus(orderNumber, 'DRAFT');
    
    // Отправляем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    await notificationHelper.expectNotification('Заказ отправлен', 'success');

    // Выходим из системы
    await authHelper.logout();

    // Шаг 2: Местность получает и одобряет заказ
    await authHelper.login('localityUser');
    
    // Проверяем, что заказ появился в списке входящих
    await page.goto('/orders');
    await expect(page.locator(`[data-testid="order-${orderNumber}"]`)).toBeVisible();
    
    // Одобряем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'APPROVED');
    await notificationHelper.expectNotification('Заказ одобрен', 'success');
    
    // Проверяем, что заказ все еще можно редактировать
    await orderHelper.expectOrderEditable(orderNumber, true);

    // Шаг 3: Начинаем сборку заказа (блокируем редактирование)
    await orderHelper.changeOrderStatus(orderNumber, 'IN_ASSEMBLY');
    
    // Проверяем, что редактирование заблокировано
    await orderHelper.expectOrderEditable(orderNumber, false);
    
    // Шаг 4: Отгружаем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'SHIPPED');
    await notificationHelper.expectNotification('Заказ отгружен', 'success');

    // Выходим из системы
    await authHelper.logout();

    // Шаг 5: Группа подтверждает доставку
    await authHelper.login('groupUser');
    
    await orderHelper.changeOrderStatus(orderNumber, 'DELIVERED');
    await notificationHelper.expectNotification('Заказ доставлен', 'success');
    
    // Шаг 6: Завершаем заказ
    await orderHelper.changeOrderStatus(orderNumber, 'COMPLETED');
    await notificationHelper.expectNotification('Заказ завершен', 'success');
    
    // Проверяем финальный статус
    await orderHelper.expectOrderStatus(orderNumber, 'COMPLETED');
  });

  test('Отклонение заказа местностью', async ({ page }) => {
    // Группа создает заказ
    await authHelper.login('groupUser');
    
    orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Рабочие тетради', quantity: 100 } // Большое количество
      ],
      notes: 'Большой заказ'
    });

    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    await authHelper.logout();

    // Местность отклоняет заказ
    await authHelper.login('localityUser');
    
    await orderHelper.changeOrderStatus(orderNumber, 'REJECTED');
    await notificationHelper.expectNotification('Заказ отклонен', 'info');
    
    // Проверяем статус
    await orderHelper.expectOrderStatus(orderNumber, 'REJECTED');
    
    await authHelper.logout();

    // Группа видит отклоненный заказ
    await authHelper.login('groupUser');
    await orderHelper.expectOrderStatus(orderNumber, 'REJECTED');
  });

  test('Блокировка и разблокировка редактирования заказа', async ({ page }) => {
    // Создаем заказ
    await authHelper.login('groupUser');
    
    orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Базовый текст', quantity: 3 }
      ]
    });

    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    await authHelper.logout();

    // Местность одобряет заказ
    await authHelper.login('localityUser');
    await orderHelper.changeOrderStatus(orderNumber, 'APPROVED');
    
    // Проверяем, что заказ можно редактировать
    await orderHelper.expectOrderEditable(orderNumber, true);
    
    // Блокируем редактирование
    await orderHelper.lockOrderForEditing(orderNumber);
    await orderHelper.expectOrderEditable(orderNumber, false);
    
    // Разблокируем редактирование
    await orderHelper.unlockOrderForEditing(orderNumber);
    await orderHelper.expectOrderEditable(orderNumber, true);
  });

  test('Заказ от местности к региону', async ({ page }) => {
    // Местность создает заказ у региона
    await authHelper.login('localityUser');
    
    orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовый Регион Сибирь',
      items: [
        { literature: 'Базовый текст', quantity: 20 },
        { literature: 'Рабочие тетради', quantity: 15 }
      ],
      notes: 'Пополнение склада местности'
    });

    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    await authHelper.logout();

    // Регион обрабатывает заказ
    await authHelper.login('regionUser');
    
    await orderHelper.changeOrderStatus(orderNumber, 'APPROVED');
    await orderHelper.changeOrderStatus(orderNumber, 'IN_ASSEMBLY');
    await orderHelper.changeOrderStatus(orderNumber, 'SHIPPED');
    
    await authHelper.logout();

    // Местность подтверждает получение
    await authHelper.login('localityUser');
    
    await orderHelper.changeOrderStatus(orderNumber, 'DELIVERED');
    await orderHelper.changeOrderStatus(orderNumber, 'COMPLETED');
    
    await orderHelper.expectOrderStatus(orderNumber, 'COMPLETED');
  });

  test('Проверка обновления остатков после выполнения заказа', async ({ page }) => {
    // Создаем и выполняем заказ
    await authHelper.login('groupUser');
    
    // Сначала проверяем текущие остатки
    await page.goto('/literature');
    const initialQuantity = await page.locator('[data-testid="literature-quantity-Базовый текст"]').textContent();
    
    orderNumber = await orderHelper.createOrder({
      toOrganization: 'Тестовая Местность Новосибирск',
      items: [
        { literature: 'Базовый текст', quantity: 2 }
      ]
    });

    // Проводим заказ через весь цикл
    await orderHelper.changeOrderStatus(orderNumber, 'PENDING');
    await authHelper.logout();

    await authHelper.login('localityUser');
    await orderHelper.changeOrderStatus(orderNumber, 'APPROVED');
    await orderHelper.changeOrderStatus(orderNumber, 'IN_ASSEMBLY');
    await orderHelper.changeOrderStatus(orderNumber, 'SHIPPED');
    await authHelper.logout();

    await authHelper.login('groupUser');
    await orderHelper.changeOrderStatus(orderNumber, 'DELIVERED');
    await orderHelper.changeOrderStatus(orderNumber, 'COMPLETED');
    
    // Проверяем, что остатки обновились
    await page.goto('/literature');
    const finalQuantity = await page.locator('[data-testid="literature-quantity-Базовый текст"]').textContent();
    
    // Остатки должны уменьшиться на количество заказанной литературы
    expect(parseInt(finalQuantity || '0')).toBeLessThan(parseInt(initialQuantity || '0'));
  });
});