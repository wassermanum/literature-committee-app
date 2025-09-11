import { Page, expect } from '@playwright/test';
import { testUsers } from './test-data';

export class AuthHelper {
  constructor(private page: Page) {}

  async login(userType: keyof typeof testUsers) {
    const user = testUsers[userType];
    
    await this.page.goto('/login');
    
    // Заполняем форму входа
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    
    // Нажимаем кнопку входа
    await this.page.click('[data-testid="login-button"]');
    
    // Ждем перенаправления на главную страницу
    await this.page.waitForURL('/dashboard');
    
    // Проверяем, что пользователь вошел в систему
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  async logout() {
    // Открываем меню пользователя
    await this.page.click('[data-testid="user-menu"]');
    
    // Нажимаем выход
    await this.page.click('[data-testid="logout-button"]');
    
    // Ждем перенаправления на страницу входа
    await this.page.waitForURL('/login');
  }

  async expectUserRole(expectedRole: string) {
    // Проверяем отображение роли пользователя в интерфейсе
    await expect(this.page.locator('[data-testid="user-role"]')).toContainText(expectedRole);
  }

  async expectAccessToPage(path: string, shouldHaveAccess: boolean = true) {
    await this.page.goto(path);
    
    if (shouldHaveAccess) {
      // Проверяем, что страница загрузилась без ошибок доступа
      await expect(this.page.locator('[data-testid="access-denied"]')).not.toBeVisible();
    } else {
      // Проверяем, что показывается ошибка доступа или перенаправление
      const isAccessDenied = await this.page.locator('[data-testid="access-denied"]').isVisible();
      const isRedirected = this.page.url() !== `${this.page.context().baseURL}${path}`;
      
      expect(isAccessDenied || isRedirected).toBeTruthy();
    }
  }
}