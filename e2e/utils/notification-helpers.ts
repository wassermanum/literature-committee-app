import { Page, expect } from '@playwright/test';

export class NotificationHelper {
  constructor(private page: Page) {}

  async expectNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const notificationSelector = `[data-testid="notification-${type}"]`;
    await expect(this.page.locator(notificationSelector)).toBeVisible();
    await expect(this.page.locator(notificationSelector)).toContainText(message);
  }

  async dismissNotification() {
    await this.page.click('[data-testid="notification-close"]');
    await expect(this.page.locator('[data-testid="notification"]')).not.toBeVisible();
  }

  async expectEmailNotification(recipient: string, subject: string) {
    // В реальном тестировании здесь можно было бы проверить
    // тестовый почтовый сервер или моки
    // Для демонстрации просто проверяем, что уведомление отправлено
    await expect(this.page.locator('[data-testid="email-sent-indicator"]')).toBeVisible();
  }

  async checkNotificationHistory() {
    await this.page.goto('/notifications');
    await expect(this.page.locator('[data-testid="notification-history"]')).toBeVisible();
  }

  async expectSystemNotification(notificationType: string) {
    // Проверяем системные уведомления в интерфейсе
    await this.page.click('[data-testid="notifications-bell"]');
    await expect(this.page.locator(`[data-testid="system-notification-${notificationType}"]`)).toBeVisible();
  }
}