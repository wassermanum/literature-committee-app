import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';

test.describe('Административные функции', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('Управление пользователями - создание нового пользователя', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/users');
    
    // Нажимаем кнопку создания пользователя
    await page.click('[data-testid="create-user-button"]');
    
    // Заполняем форму нового пользователя
    await page.fill('[data-testid="email-input"]', 'newuser@test.com');
    await page.fill('[data-testid="password-input"]', 'newuser123');
    await page.fill('[data-testid="confirm-password-input"]', 'newuser123');
    await page.fill('[data-testid="first-name-input"]', 'Новый');
    await page.fill('[data-testid="last-name-input"]', 'Пользователь');
    
    // Выбираем роль
    await page.selectOption('[data-testid="role-select"]', 'group');
    
    // Выбираем организацию
    await page.selectOption('[data-testid="organization-select"]', 'Тестовая Группа Надежда');
    
    // Сохраняем пользователя
    await page.click('[data-testid="save-user-button"]');
    
    // Проверяем успешное создание
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Пользователь создан');
    
    // Проверяем, что пользователь появился в списке
    await expect(page.locator('[data-testid="user-row-newuser@test.com"]')).toBeVisible();
  });

  test('Редактирование существующего пользователя', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/users');
    
    // Находим пользователя и нажимаем редактировать
    await page.click('[data-testid="edit-user-group@test.com"]');
    
    // Изменяем данные
    await page.fill('[data-testid="first-name-input"]', 'Обновленное Имя');
    await page.fill('[data-testid="last-name-input"]', 'Обновленная Фамилия');
    
    // Сохраняем изменения
    await page.click('[data-testid="save-user-button"]');
    
    // Проверяем успешное обновление
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Проверяем, что изменения отображаются
    await expect(page.locator('[data-testid="user-name-group@test.com"]')).toContainText('Обновленное Имя Обновленная Фамилия');
  });

  test('Назначение и изменение ролей пользователей', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/users');
    
    // Открываем управление ролями для пользователя
    await page.click('[data-testid="manage-roles-group@test.com"]');
    
    // Изменяем роль
    await page.selectOption('[data-testid="role-select"]', 'locality');
    
    // Изменяем организацию соответственно новой роли
    await page.selectOption('[data-testid="organization-select"]', 'Тестовая Местность Новосибирск');
    
    // Сохраняем изменения
    await page.click('[data-testid="save-role-button"]');
    
    // Проверяем успешное изменение
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Проверяем, что роль изменилась
    await expect(page.locator('[data-testid="user-role-group@test.com"]')).toContainText('Местность');
  });

  test('Деактивация и активация пользователей', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/users');
    
    // Деактивируем пользователя
    await page.click('[data-testid="deactivate-user-group@test.com"]');
    
    // Подтверждаем деактивацию
    await page.click('[data-testid="confirm-deactivate-button"]');
    
    // Проверяем успешную деактивацию
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Проверяем, что пользователь помечен как неактивный
    await expect(page.locator('[data-testid="user-status-group@test.com"]')).toContainText('Неактивен');
    
    // Активируем пользователя обратно
    await page.click('[data-testid="activate-user-group@test.com"]');
    
    // Проверяем активацию
    await expect(page.locator('[data-testid="user-status-group@test.com"]')).toContainText('Активен');
  });

  test('Управление организациями - создание новой организации', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/organizations');
    
    // Создаем новую организацию
    await page.click('[data-testid="create-organization-button"]');
    
    // Заполняем форму
    await page.fill('[data-testid="name-input"]', 'Новая Тестовая Группа');
    await page.selectOption('[data-testid="type-select"]', 'group');
    await page.selectOption('[data-testid="parent-select"]', 'Тестовая Местность Новосибирск');
    await page.fill('[data-testid="address-input"]', 'г. Новосибирск, ул. Новая, 10');
    await page.fill('[data-testid="contact-person-input"]', 'Новиков Н.Н.');
    await page.fill('[data-testid="phone-input"]', '+7-999-456-78-90');
    await page.fill('[data-testid="email-input"]', 'newgroup@test.com');
    
    // Сохраняем организацию
    await page.click('[data-testid="save-organization-button"]');
    
    // Проверяем успешное создание
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Проверяем, что организация появилась в списке
    await expect(page.locator('[data-testid="organization-row-Новая Тестовая Группа"]')).toBeVisible();
  });

  test('Редактирование организации', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/organizations');
    
    // Редактируем существующую организацию
    await page.click('[data-testid="edit-organization-Тестовая Группа Надежда"]');
    
    // Изменяем данные
    await page.fill('[data-testid="address-input"]', 'г. Новосибирск, ул. Обновленная, 5');
    await page.fill('[data-testid="phone-input"]', '+7-999-111-22-33');
    
    // Сохраняем изменения
    await page.click('[data-testid="save-organization-button"]');
    
    // Проверяем успешное обновление
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('Системные настройки', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/settings');
    
    // Изменяем системные настройки
    await page.fill('[data-testid="system-name-input"]', 'Литературный Комитет АН Сибирь');
    await page.fill('[data-testid="admin-email-input"]', 'admin@literature-committee.org');
    
    // Настройки уведомлений
    await page.check('[data-testid="email-notifications-enabled"]');
    await page.fill('[data-testid="smtp-server-input"]', 'smtp.test.com');
    await page.fill('[data-testid="smtp-port-input"]', '587');
    
    // Настройки заказов
    await page.fill('[data-testid="order-timeout-input"]', '7'); // дней до автоматического закрытия
    await page.check('[data-testid="auto-approve-enabled"]');
    
    // Сохраняем настройки
    await page.click('[data-testid="save-settings-button"]');
    
    // Проверяем успешное сохранение
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Настройки сохранены');
  });

  test('Просмотр логов системы', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/logs');
    
    // Проверяем отображение логов
    await expect(page.locator('[data-testid="logs-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCountGreaterThan(0);
    
    // Фильтрация логов по уровню
    await page.selectOption('[data-testid="log-level-filter"]', 'error');
    await page.click('[data-testid="apply-filter-button"]');
    
    // Проверяем, что отображаются только ошибки
    const logEntries = await page.locator('[data-testid="log-level"]').allTextContents();
    logEntries.forEach(level => {
      expect(level.toLowerCase()).toContain('error');
    });
    
    // Фильтрация по дате
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.click('[data-testid="apply-filter-button"]');
    
    // Проверяем, что логи отфильтрованы по дате
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCountGreaterThan(0);
  });

  test('Резервное копирование данных', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/backup');
    
    // Создаем резервную копию
    await page.click('[data-testid="create-backup-button"]');
    
    // Ждем создания резервной копии
    await expect(page.locator('[data-testid="backup-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="backup-progress"]')).not.toBeVisible({ timeout: 30000 });
    
    // Проверяем успешное создание
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Проверяем, что резервная копия появилась в списке
    await expect(page.locator('[data-testid="backup-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="backup-item"]')).toHaveCountGreaterThan(0);
  });

  test('Статистика системы', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/admin/statistics');
    
    // Проверяем отображение основных метрик
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-organizations"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-literature"]')).toBeVisible();
    
    // Проверяем графики активности
    await expect(page.locator('[data-testid="orders-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="users-activity-chart"]')).toBeVisible();
    
    // Проверяем таблицу активных пользователей
    await expect(page.locator('[data-testid="active-users-table"]')).toBeVisible();
  });

  test('Валидация прав доступа к административным функциям', async ({ page }) => {
    // Проверяем, что обычные пользователи не имеют доступа к админке
    await authHelper.login('groupUser');
    
    await authHelper.expectAccessToPage('/admin', false);
    await authHelper.expectAccessToPage('/admin/users', false);
    await authHelper.expectAccessToPage('/admin/organizations', false);
    await authHelper.expectAccessToPage('/admin/settings', false);
    
    await authHelper.logout();
    
    // Проверяем, что пользователи региона также не имеют полного доступа к админке
    await authHelper.login('regionUser');
    
    await authHelper.expectAccessToPage('/admin', false);
    await authHelper.expectAccessToPage('/admin/users', false);
    
    await authHelper.logout();
    
    // Проверяем полный доступ администратора
    await authHelper.login('admin');
    
    await authHelper.expectAccessToPage('/admin', true);
    await authHelper.expectAccessToPage('/admin/users', true);
    await authHelper.expectAccessToPage('/admin/organizations', true);
    await authHelper.expectAccessToPage('/admin/settings', true);
  });
});