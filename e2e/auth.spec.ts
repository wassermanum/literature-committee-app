import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';

test.describe('Аутентификация и авторизация', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('Успешный вход администратора', async ({ page }) => {
    await authHelper.login('admin');
    
    // Проверяем, что пользователь на главной странице
    await expect(page).toHaveURL('/dashboard');
    
    // Проверяем отображение роли
    await authHelper.expectUserRole('Администратор');
    
    // Проверяем доступ к административным функциям
    await authHelper.expectAccessToPage('/admin');
  });

  test('Успешный вход пользователя региона', async ({ page }) => {
    await authHelper.login('regionUser');
    
    await expect(page).toHaveURL('/dashboard');
    await authHelper.expectUserRole('Регион');
    
    // Проверяем доступ к функциям региона
    await authHelper.expectAccessToPage('/orders');
    await authHelper.expectAccessToPage('/reports');
    
    // Проверяем отсутствие доступа к админке
    await authHelper.expectAccessToPage('/admin', false);
  });

  test('Успешный вход пользователя местности', async ({ page }) => {
    await authHelper.login('localityUser');
    
    await expect(page).toHaveURL('/dashboard');
    await authHelper.expectUserRole('Местность');
    
    // Проверяем доступ к основным функциям
    await authHelper.expectAccessToPage('/orders');
    await authHelper.expectAccessToPage('/literature');
    
    // Проверяем ограниченный доступ к отчетам
    await authHelper.expectAccessToPage('/reports');
  });

  test('Успешный вход пользователя группы', async ({ page }) => {
    await authHelper.login('groupUser');
    
    await expect(page).toHaveURL('/dashboard');
    await authHelper.expectUserRole('Группа');
    
    // Проверяем базовый доступ
    await authHelper.expectAccessToPage('/orders');
    await authHelper.expectAccessToPage('/literature');
    
    // Проверяем отсутствие доступа к административным функциям
    await authHelper.expectAccessToPage('/admin', false);
  });

  test('Неуспешный вход с неверными данными', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Проверяем сообщение об ошибке
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Неверные учетные данные');
    
    // Проверяем, что остались на странице входа
    await expect(page).toHaveURL('/login');
  });

  test('Выход из системы', async ({ page }) => {
    await authHelper.login('admin');
    
    // Выходим из системы
    await authHelper.logout();
    
    // Проверяем перенаправление на страницу входа
    await expect(page).toHaveURL('/login');
    
    // Проверяем, что доступ к защищенным страницам заблокирован
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('Автоматическое перенаправление неавторизованного пользователя', async ({ page }) => {
    // Пытаемся зайти на защищенную страницу без авторизации
    await page.goto('/orders');
    
    // Должны быть перенаправлены на страницу входа
    await expect(page).toHaveURL('/login');
  });

  test('Сохранение сессии при обновлении страницы', async ({ page }) => {
    await authHelper.login('admin');
    
    // Обновляем страницу
    await page.reload();
    
    // Проверяем, что пользователь остался авторизованным
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await authHelper.expectUserRole('Администратор');
  });
});