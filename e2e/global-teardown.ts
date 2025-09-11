import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Запуск глобальной очистки после E2E тестов...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Очищаем тестовые данные
    console.log('Очистка тестовых данных...');
    
    const cleanupResponse = await page.request.post('http://localhost:3000/api/test/cleanup');
    if (!cleanupResponse.ok()) {
      console.warn('Не удалось очистить тестовые данные:', await cleanupResponse.text());
    } else {
      console.log('Тестовые данные успешно очищены');
    }
    
    // Сохраняем отчеты о тестировании
    console.log('Сохранение отчетов о тестировании...');
    
    const reportsResponse = await page.request.post('http://localhost:3000/api/test/save-reports');
    if (reportsResponse.ok()) {
      console.log('Отчеты о тестировании сохранены');
    }
    
    console.log('Глобальная очистка завершена успешно');
    
  } catch (error) {
    console.error('Ошибка при глобальной очистке:', error);
    // Не прерываем выполнение, так как это не критично
  } finally {
    await browser.close();
  }
}

export default globalTeardown;