import { test, expect } from '@playwright/test';
import { AuthHelper } from './utils/auth-helpers';

test.describe('Система отчетности', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test('Генерация отчета по движению литературы', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Выбираем тип отчета
    await page.selectOption('[data-testid="report-type-select"]', 'movement');
    
    // Устанавливаем период
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    
    // Выбираем организацию (опционально)
    await page.selectOption('[data-testid="organization-filter"]', 'all');
    
    // Генерируем отчет
    await page.click('[data-testid="generate-report-button"]');
    
    // Ждем загрузки отчета
    await expect(page.locator('[data-testid="report-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-loading"]')).not.toBeVisible();
    
    // Проверяем отображение отчета
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-title"]')).toContainText('Отчет по движению литературы');
    
    // Проверяем наличие данных в отчете
    await expect(page.locator('[data-testid="report-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-row"]')).toHaveCountGreaterThan(0);
  });

  test('Генерация финансового отчета', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Выбираем финансовый отчет
    await page.selectOption('[data-testid="report-type-select"]', 'financial');
    
    // Устанавливаем период
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    
    // Генерируем отчет
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-title"]')).toContainText('Финансовый отчет');
    
    // Проверяем финансовые показатели
    await expect(page.locator('[data-testid="total-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-expenses"]')).toBeVisible();
    await expect(page.locator('[data-testid="net-result"]')).toBeVisible();
    
    // Проверяем группировку по периодам
    await expect(page.locator('[data-testid="monthly-breakdown"]')).toBeVisible();
  });

  test('Отчет по остаткам на складах', async ({ page }) => {
    await authHelper.login('localityUser');
    await page.goto('/reports');
    
    // Выбираем отчет по остаткам
    await page.selectOption('[data-testid="report-type-select"]', 'inventory');
    
    // Выбираем склады для отчета
    await page.check('[data-testid="warehouse-locality"]');
    
    // Генерируем отчет
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-title"]')).toContainText('Отчет по остаткам');
    
    // Проверяем данные по остаткам
    await expect(page.locator('[data-testid="inventory-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="literature-row"]')).toHaveCountGreaterThan(0);
    
    // Проверяем отображение количества и стоимости
    await expect(page.locator('[data-testid="total-quantity"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
  });

  test('Экспорт отчета в PDF', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Генерируем отчет
    await page.selectOption('[data-testid="report-type-select"]', 'movement');
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Настраиваем ожидание загрузки файла
    const downloadPromise = page.waitForEvent('download');
    
    // Экспортируем в PDF
    await page.click('[data-testid="export-pdf-button"]');
    
    const download = await downloadPromise;
    
    // Проверяем, что файл загружен
    expect(download.suggestedFilename()).toContain('.pdf');
    expect(download.suggestedFilename()).toContain('movement-report');
  });

  test('Экспорт отчета в Excel', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Генерируем отчет
    await page.selectOption('[data-testid="report-type-select"]', 'financial');
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Настраиваем ожидание загрузки файла
    const downloadPromise = page.waitForEvent('download');
    
    // Экспортируем в Excel
    await page.click('[data-testid="export-excel-button"]');
    
    const download = await downloadPromise;
    
    // Проверяем, что файл загружен
    expect(download.suggestedFilename()).toMatch(/\.(xlsx|xls)$/);
    expect(download.suggestedFilename()).toContain('financial-report');
  });

  test('Фильтрация отчетов по организациям', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Генерируем отчет с фильтром по конкретной организации
    await page.selectOption('[data-testid="report-type-select"]', 'movement');
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.selectOption('[data-testid="organization-filter"]', 'Тестовая Местность Новосибирск');
    
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Проверяем, что в отчете только данные выбранной организации
    const organizationCells = await page.locator('[data-testid="organization-cell"]').allTextContents();
    organizationCells.forEach(cell => {
      expect(cell).toContain('Тестовая Местность Новосибирск');
    });
  });

  test('Валидация периода отчета', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Пытаемся создать отчет с некорректным периодом
    await page.selectOption('[data-testid="report-type-select"]', 'movement');
    await page.fill('[data-testid="date-from-input"]', '2024-12-31');
    await page.fill('[data-testid="date-to-input"]', '2024-01-01'); // Дата окончания раньше начала
    
    await page.click('[data-testid="generate-report-button"]');
    
    // Проверяем сообщение об ошибке
    await expect(page.locator('[data-testid="date-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-error"]')).toContainText('Дата окончания должна быть позже даты начала');
  });

  test('Ограничения доступа к отчетам по ролям', async ({ page }) => {
    // Проверяем доступ группы к отчетам
    await authHelper.login('groupUser');
    await page.goto('/reports');
    
    // Группа должна видеть только ограниченный набор отчетов
    const reportOptions = await page.locator('[data-testid="report-type-select"] option').allTextContents();
    expect(reportOptions).not.toContain('Финансовый отчет'); // Группа не должна видеть финансовые отчеты
    
    await authHelper.logout();
    
    // Проверяем доступ местности
    await authHelper.login('localityUser');
    await page.goto('/reports');
    
    const localityReportOptions = await page.locator('[data-testid="report-type-select"] option').allTextContents();
    expect(localityReportOptions).toContain('Отчет по остаткам');
    expect(localityReportOptions).toContain('Отчет по движению литературы');
    
    await authHelper.logout();
    
    // Проверяем полный доступ региона
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    const regionReportOptions = await page.locator('[data-testid="report-type-select"] option').allTextContents();
    expect(regionReportOptions).toContain('Финансовый отчет');
    expect(regionReportOptions).toContain('Отчет по движению литературы');
    expect(regionReportOptions).toContain('Отчет по остаткам');
  });

  test('Предварительный просмотр отчета', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Генерируем отчет
    await page.selectOption('[data-testid="report-type-select"]', 'movement');
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.click('[data-testid="generate-report-button"]');
    
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
    
    // Открываем предварительный просмотр
    await page.click('[data-testid="preview-button"]');
    
    // Проверяем модальное окно предварительного просмотра
    await expect(page.locator('[data-testid="preview-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-content"]')).toBeVisible();
    
    // Закрываем предварительный просмотр
    await page.click('[data-testid="close-preview-button"]');
    await expect(page.locator('[data-testid="preview-modal"]')).not.toBeVisible();
  });

  test('Сохранение настроек отчета', async ({ page }) => {
    await authHelper.login('regionUser');
    await page.goto('/reports');
    
    // Настраиваем отчет
    await page.selectOption('[data-testid="report-type-select"]', 'financial');
    await page.fill('[data-testid="date-from-input"]', '2024-01-01');
    await page.fill('[data-testid="date-to-input"]', '2024-12-31');
    await page.selectOption('[data-testid="organization-filter"]', 'all');
    
    // Сохраняем настройки
    await page.click('[data-testid="save-settings-button"]');
    await page.fill('[data-testid="settings-name-input"]', 'Годовой финансовый отчет');
    await page.click('[data-testid="confirm-save-button"]');
    
    // Проверяем сохранение
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Обновляем страницу и проверяем, что настройки сохранились
    await page.reload();
    
    await page.selectOption('[data-testid="saved-settings-select"]', 'Годовой финансовый отчет');
    
    // Проверяем, что настройки загрузились
    expect(await page.locator('[data-testid="report-type-select"]').inputValue()).toBe('financial');
    expect(await page.locator('[data-testid="date-from-input"]').inputValue()).toBe('2024-01-01');
    expect(await page.locator('[data-testid="date-to-input"]').inputValue()).toBe('2024-12-31');
  });
});