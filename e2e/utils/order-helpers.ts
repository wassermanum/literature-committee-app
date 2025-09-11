import { Page, expect } from '@playwright/test';

export class OrderHelper {
  constructor(private page: Page) {}

  async createOrder(orderData: {
    toOrganization: string;
    items: Array<{
      literature: string;
      quantity: number;
    }>;
    notes?: string;
  }) {
    // Переходим на страницу заказов
    await this.page.goto('/orders');
    
    // Нажимаем кнопку создания нового заказа
    await this.page.click('[data-testid="create-order-button"]');
    
    // Ждем загрузки формы
    await expect(this.page.locator('[data-testid="order-form"]')).toBeVisible();
    
    // Выбираем организацию-получателя
    await this.page.click('[data-testid="to-organization-select"]');
    await this.page.click(`[data-testid="organization-option-${orderData.toOrganization}"]`);
    
    // Добавляем позиции заказа
    for (const item of orderData.items) {
      await this.page.click('[data-testid="add-order-item-button"]');
      
      // Выбираем литературу
      await this.page.click('[data-testid="literature-select"]:last-of-type');
      await this.page.click(`[data-testid="literature-option-${item.literature}"]`);
      
      // Указываем количество
      await this.page.fill('[data-testid="quantity-input"]:last-of-type', item.quantity.toString());
    }
    
    // Добавляем примечания, если есть
    if (orderData.notes) {
      await this.page.fill('[data-testid="notes-input"]', orderData.notes);
    }
    
    // Сохраняем заказ
    await this.page.click('[data-testid="save-order-button"]');
    
    // Ждем сохранения и получаем ID заказа
    await expect(this.page.locator('[data-testid="order-success-message"]')).toBeVisible();
    
    const orderNumber = await this.page.locator('[data-testid="order-number"]').textContent();
    return orderNumber;
  }

  async changeOrderStatus(orderNumber: string, newStatus: string) {
    // Находим заказ в списке
    await this.page.goto('/orders');
    await this.page.click(`[data-testid="order-${orderNumber}"]`);
    
    // Ждем загрузки деталей заказа
    await expect(this.page.locator('[data-testid="order-details"]')).toBeVisible();
    
    // Изменяем статус
    await this.page.click('[data-testid="status-select"]');
    await this.page.click(`[data-testid="status-option-${newStatus}"]`);
    
    // Подтверждаем изменение
    await this.page.click('[data-testid="update-status-button"]');
    
    // Ждем обновления
    await expect(this.page.locator('[data-testid="status-updated-message"]')).toBeVisible();
  }

  async expectOrderStatus(orderNumber: string, expectedStatus: string) {
    await this.page.goto('/orders');
    await this.page.click(`[data-testid="order-${orderNumber}"]`);
    
    await expect(this.page.locator('[data-testid="current-status"]')).toContainText(expectedStatus);
  }

  async expectOrderEditable(orderNumber: string, shouldBeEditable: boolean = true) {
    await this.page.goto('/orders');
    await this.page.click(`[data-testid="order-${orderNumber}"]`);
    
    const editButton = this.page.locator('[data-testid="edit-order-button"]');
    
    if (shouldBeEditable) {
      await expect(editButton).toBeVisible();
      await expect(editButton).toBeEnabled();
    } else {
      const isDisabled = await editButton.isDisabled();
      const isHidden = !(await editButton.isVisible());
      expect(isDisabled || isHidden).toBeTruthy();
    }
  }

  async lockOrderForEditing(orderNumber: string) {
    await this.page.goto('/orders');
    await this.page.click(`[data-testid="order-${orderNumber}"]`);
    
    await this.page.click('[data-testid="lock-order-button"]');
    await expect(this.page.locator('[data-testid="order-locked-message"]')).toBeVisible();
  }

  async unlockOrderForEditing(orderNumber: string) {
    await this.page.goto('/orders');
    await this.page.click(`[data-testid="order-${orderNumber}"]`);
    
    await this.page.click('[data-testid="unlock-order-button"]');
    await expect(this.page.locator('[data-testid="order-unlocked-message"]')).toBeVisible();
  }
}