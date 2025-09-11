import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';

test.describe('Управление каталогом литературы', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('Просмотр каталога литературы всеми ролями', async ({ page }) => {
    // Проверяем доступ для группы
    await authHelper.login('groupUser');
    await page.goto('/literature');
    
    await expect(page.locator('[data-testid="literature-catalog"]')).toBeVisible();
    await expect(page.locator('[data-testid="literature-item"]')).toHaveCount(3); // Базовые тестовые данные
    
    // Проверяем, что группа не может добавлять литературу
    await expect(page.locator('[data-testid="add-literature-button"]')).not.toBeVisible();
    
    await authHelper.logout();

    // Проверяем доступ для местности
    await authHelper.login('localityUser');
    await page.goto('/literature');
    
    await expect(page.locator('[data-testid="literature-catalog"]')).toBeVisible();
    
    // Местность может иметь ограниченные права на добавление
    const canAddLiterature = await page.locator('[data-testid="add-literature-button"]').isVisible();
    // Это зависит от бизнес-логики - может быть как true, так и false
    
    await authHelper.logout();

    // Проверяем доступ для региона
    await authHelper.login('regionUser');
    await page.goto('/literature');
    
    await expect(page.locator('[data-testid="literature-catalog"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-literature-button"]')).toBeVisible();
    
    await authHelper.logout();

    // Проверяем доступ для администратора
    await authHelper.login('admin');
    await page.goto('/literature');
    
    await expect(page.locator('[data-testid="literature-catalog"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-literature-button"]')).toBeVisible();
  });

  test('Добавление новой литературы администратором', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/literature');
    
    // Нажимаем кнопку добавления
    await page.click('[data-testid="add-literature-button"]');
    
    // Заполняем форму
    await page.fill('[data-testid="title-input"]', 'Новая тестовая литература');
    await page.fill('[data-testid="description-input"]', 'Описание новой литературы для тестирования');
    await page.selectOption('[data-testid="category-select"]', 'Тестовая категория');
    await page.fill('[data-testid="price-input"]', '125.50');
    
    // Сохраняем
    await page.click('[data-testid="save-literature-button"]');
    
    // Проверяем успешное сохранение
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Литература добавлена');
    
    // Проверяем, что литература появилась в каталоге
    await expect(page.locator('[data-testid="literature-item-Новая тестовая литература"]')).toBeVisible();
  });

  test('Редактирование существующей литературы', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/literature');
    
    // Находим существующую литературу и нажимаем редактировать
    await page.click('[data-testid="edit-literature-Базовый текст"]');
    
    // Изменяем данные
    await page.fill('[data-testid="description-input"]', 'Обновленное описание базового текста');
    await page.fill('[data-testid="price-input"]', '175.00');
    
    // Сохраняем изменения
    await page.click('[data-testid="save-literature-button"]');
    
    // Проверяем успешное обновление
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Проверяем, что изменения отображаются
    await expect(page.locator('[data-testid="literature-description-Базовый текст"]')).toContainText('Обновленное описание');
    await expect(page.locator('[data-testid="literature-price-Базовый текст"]')).toContainText('175.00');
  });

  test('Поиск и фильтрация литературы', async ({ page }) => {
    await authHelper.login('groupUser');
    await page.goto('/literature');
    
    // Тестируем поиск по названию
    await page.fill('[data-testid="search-input"]', 'Базовый');
    await page.click('[data-testid="search-button"]');
    
    // Проверяем результаты поиска
    await expect(page.locator('[data-testid="literature-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="literature-item-Базовый текст"]')).toBeVisible();
    
    // Очищаем поиск
    await page.fill('[data-testid="search-input"]', '');
    await page.click('[data-testid="search-button"]');
    
    // Тестируем фильтрацию по категории
    await page.selectOption('[data-testid="category-filter"]', 'Информационные материалы');
    
    // Проверяем фильтрацию
    await expect(page.locator('[data-testid="literature-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="literature-item-Информационные брошюры"]')).toBeVisible();
    
    // Сбрасываем фильтры
    await page.selectOption('[data-testid="category-filter"]', '');
    await expect(page.locator('[data-testid="literature-item"]')).toHaveCount(3);
  });

  test('Отображение остатков на складах', async ({ page }) => {
    await authHelper.login('localityUser');
    await page.goto('/literature');
    
    // Проверяем отображение остатков для каждой позиции
    await expect(page.locator('[data-testid="inventory-Базовый текст"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-Информационные брошюры"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-Рабочие тетради"]')).toBeVisible();
    
    // Проверяем детальную информацию об остатках
    await page.click('[data-testid="literature-item-Базовый текст"]');
    
    await expect(page.locator('[data-testid="inventory-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="available-quantity"]')).toBeVisible();
    await expect(page.locator('[data-testid="reserved-quantity"]')).toBeVisible();
  });

  test('Валидация формы добавления литературы', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/literature');
    
    await page.click('[data-testid="add-literature-button"]');
    
    // Пытаемся сохранить пустую форму
    await page.click('[data-testid="save-literature-button"]');
    
    // Проверяем сообщения об ошибках валидации
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Название обязательно');
    
    await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-error"]')).toContainText('Цена обязательна');
    
    // Заполняем некорректные данные
    await page.fill('[data-testid="title-input"]', 'А'); // Слишком короткое название
    await page.fill('[data-testid="price-input"]', '-10'); // Отрицательная цена
    
    await page.click('[data-testid="save-literature-button"]');
    
    // Проверяем сообщения об ошибках
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Название должно содержать минимум 3 символа');
    await expect(page.locator('[data-testid="price-error"]')).toContainText('Цена должна быть положительной');
  });

  test('Удаление литературы с проверкой активных заказов', async ({ page }) => {
    await authHelper.login('admin');
    await page.goto('/literature');
    
    // Пытаемся удалить литературу, которая используется в активных заказах
    await page.click('[data-testid="delete-literature-Базовый текст"]');
    
    // Должно появиться предупреждение
    await expect(page.locator('[data-testid="delete-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="delete-warning"]')).toContainText('Нельзя удалить литературу с активными заказами');
    
    // Подтверждаем удаление
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Проверяем, что удаление не произошло из-за активных заказов
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="literature-item-Базовый текст"]')).toBeVisible();
  });

  test('Сортировка каталога литературы', async ({ page }) => {
    await authHelper.login('groupUser');
    await page.goto('/literature');
    
    // Сортировка по названию (по возрастанию)
    await page.click('[data-testid="sort-by-title-asc"]');
    
    const titlesAsc = await page.locator('[data-testid="literature-title"]').allTextContents();
    expect(titlesAsc).toEqual([...titlesAsc].sort());
    
    // Сортировка по названию (по убыванию)
    await page.click('[data-testid="sort-by-title-desc"]');
    
    const titlesDesc = await page.locator('[data-testid="literature-title"]').allTextContents();
    expect(titlesDesc).toEqual([...titlesDesc].sort().reverse());
    
    // Сортировка по цене (по возрастанию)
    await page.click('[data-testid="sort-by-price-asc"]');
    
    const pricesAsc = await page.locator('[data-testid="literature-price"]').allTextContents();
    const numericPricesAsc = pricesAsc.map(p => parseFloat(p.replace(/[^\d.]/g, '')));
    expect(numericPricesAsc).toEqual([...numericPricesAsc].sort((a, b) => a - b));
  });
});