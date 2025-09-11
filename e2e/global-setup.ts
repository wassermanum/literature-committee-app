import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Запуск глобальной настройки E2E тестов...');
  
  // Запускаем браузер для предварительной настройки
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Ждем, пока сервер будет готов
    console.log('Ожидание готовности сервера...');
    
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 секунд
    
    while (!serverReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get('http://localhost:3000/api/health');
        if (response.ok()) {
          serverReady = true;
          console.log('Сервер готов к работе');
        }
      } catch (error) {
        // Сервер еще не готов
      }
      
      if (!serverReady) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    if (!serverReady) {
      throw new Error('Сервер не готов к работе после 30 секунд ожидания');
    }
    
    // Проверяем готовность frontend
    console.log('Проверка готовности frontend...');
    
    let frontendReady = false;
    attempts = 0;
    
    while (!frontendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get('http://localhost:5173');
        if (response.ok()) {
          frontendReady = true;
          console.log('Frontend готов к работе');
        }
      } catch (error) {
        // Frontend еще не готов
      }
      
      if (!frontendReady) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }
    
    if (!frontendReady) {
      throw new Error('Frontend не готов к работе после 30 секунд ожидания');
    }
    
    // Инициализируем базу данных тестовыми данными
    console.log('Инициализация тестовых данных...');
    
    const initResponse = await page.request.post('http://localhost:3000/api/test/init');
    if (!initResponse.ok()) {
      console.warn('Не удалось инициализировать тестовые данные:', await initResponse.text());
    } else {
      console.log('Тестовые данные успешно инициализированы');
    }
    
    console.log('Глобальная настройка завершена успешно');
    
  } catch (error) {
    console.error('Ошибка при глобальной настройке:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;