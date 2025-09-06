const http = require('http');

// Конфигурация
const HOST = 'localhost';
const PORT = 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

// Тестовые данные для аутентификации
const TEST_USER = {
  email: 'admin@test.com',
  password: 'admin123'
};

let authToken = '';

// Функция для выполнения HTTP запросов
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Функция для аутентификации
async function authenticate() {
  console.log('🔐 Аутентификация...');
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', TEST_USER);
    
    if (response.status === 200 && response.body.success) {
      authToken = response.body.data.token;
      console.log('✅ Аутентификация успешна');
      return true;
    } else {
      console.log('❌ Ошибка аутентификации:', response.body.message || 'Неизвестная ошибка');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при аутентификации:', error.message);
    return false;
  }
}

// Тест отчета по заказам
async function testOrdersReport() {
  console.log('\n📊 Тестирование отчета по заказам...');
  
  try {
    const response = await makeRequest('GET', '/api/reports/orders', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200 && response.body.success) {
      console.log('✅ Отчет по заказам получен успешно');
      console.log('   - Всего заказов:', response.body.data.summary.totalOrders);
      console.log('   - Общая сумма:', response.body.data.summary.totalAmount);
      console.log('   - Средняя стоимость заказа:', response.body.data.summary.averageOrderValue);
      console.log('   - Статусы:', response.body.data.byStatus.length);
      return true;
    } else {
      console.log('❌ Ошибка получения отчета по заказам:', response.body.message || 'Неизвестная ошибка');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при получении отчета по заказам:', error.message);
    return false;
  }
}

// Тест отчета по остаткам
async function testInventoryReport() {
  console.log('\n📦 Тестирование отчета по остаткам...');
  
  try {
    const response = await makeRequest('GET', '/api/reports/inventory', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200 && response.body.success) {
      console.log('✅ Отчет по остаткам получен успешно');
      console.log('   - Всего позиций:', response.body.data.summary.totalItems);
      console.log('   - Общее количество:', response.body.data.summary.totalQuantity);
      console.log('   - Зарезервировано:', response.body.data.summary.totalReserved);
      console.log('   - Общая стоимость:', response.body.data.summary.totalValue);
      console.log('   - Мало на складе:', response.body.data.summary.lowStockCount);
      return true;
    } else {
      console.log('❌ Ошибка получения отчета по остаткам:', response.body.message || 'Неизвестная ошибка');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при получении отчета по остаткам:', error.message);
    return false;
  }
}

// Тест отчета по движению
async function testMovementReport() {
  console.log('\n🔄 Тестирование отчета по движению...');
  
  try {
    const response = await makeRequest('GET', '/api/reports/movement', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200 && response.body.success) {
      console.log('✅ Отчет по движению получен успешно');
      console.log('   - Всего транзакций:', response.body.data.summary.totalTransactions);
      console.log('   - Общее количество:', response.body.data.summary.totalQuantity);
      console.log('   - Общая сумма:', response.body.data.summary.totalAmount);
      console.log('   - Типы транзакций:', response.body.data.byType.length);
      return true;
    } else {
      console.log('❌ Ошибка получения отчета по движению:', response.body.message || 'Неизвестная ошибка');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при получении отчета по движению:', error.message);
    return false;
  }
}

// Тест дашборда
async function testDashboard() {
  console.log('\n📈 Тестирование дашборда...');
  
  try {
    const response = await makeRequest('GET', '/api/reports/dashboard', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200 && response.body.success) {
      console.log('✅ Дашборд получен успешно');
      console.log('   - Период:', response.body.data.period);
      console.log('   - Данные по заказам: есть');
      console.log('   - Данные по остаткам: есть');
      console.log('   - Данные по движению: есть');
      console.log('   - Топ литература:', response.body.data.topLiterature.length, 'позиций');
      console.log('   - Активность по дням недели: есть');
      return true;
    } else {
      console.log('❌ Ошибка получения дашборда:', response.body.message || 'Неизвестная ошибка');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при получении дашборда:', error.message);
    return false;
  }
}

// Тест сводки отчетов
async function testReportSummary() {
  console.log('\n📋 Тестирование сводки отчетов...');
  
  try {
    const response = await makeRequest('GET', '/api/reports/summary', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200 && response.body.success) {
      console.log('✅ Сводка отчетов получена успешно');
      console.log('   - Заказы: всего', response.body.data.orders.total);
      console.log('   - Остатки: всего позиций', response.body.data.inventory.totalItems);
      console.log('   - Движение: всего транзакций', response.body.data.movement.totalTransactions);
      return true;
    } else {
      console.log('❌ Ошибка получения сводки отчетов:', response.body.message || 'Неизвестная ошибка');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при получении сводки отчетов:', error.message);
    return false;
  }
}

// Тест экспорта отчетов
async function testReportExport() {
  console.log('\n💾 Тестирование экспорта отчетов...');
  
  try {
    // Тест экспорта в CSV
    const csvResponse = await makeRequest('GET', '/api/reports/export/orders?format=csv', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (csvResponse.status === 200) {
      console.log('✅ Экспорт в CSV успешен');
      console.log('   - Content-Type:', csvResponse.headers['content-type']);
      console.log('   - Content-Disposition:', csvResponse.headers['content-disposition']);
    } else {
      console.log('❌ Ошибка экспорта в CSV');
      return false;
    }
    
    // Тест экспорта в JSON
    const jsonResponse = await makeRequest('GET', '/api/reports/export/inventory?format=json', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (jsonResponse.status === 200) {
      console.log('✅ Экспорт в JSON успешен');
      console.log('   - Content-Type:', jsonResponse.headers['content-type']);
      console.log('   - Content-Disposition:', jsonResponse.headers['content-disposition']);
    } else {
      console.log('❌ Ошибка экспорта в JSON');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Ошибка при экспорте отчетов:', error.message);
    return false;
  }
}

// Тест фильтрации отчетов
async function testReportFiltering() {
  console.log('\n🔍 Тестирование фильтрации отчетов...');
  
  try {
    // Тест фильтрации по периоду
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - 1);
    const dateTo = new Date();
    
    const response = await makeRequest('GET', 
      `/api/reports/orders?dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`, 
      null, {
        'Authorization': `Bearer ${authToken}`
      });
    
    if (response.status === 200 && response.body.success) {
      console.log('✅ Фильтрация по периоду работает');
      console.log('   - Заказов за период:', response.body.data.summary.totalOrders);
      return true;
    } else {
      console.log('❌ Ошибка фильтрации по периоду:', response.body.message || 'Неизвестная ошибка');
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при тестировании фильтрации:', error.message);
    return false;
  }
}

// Основная функция тестирования
async function runTests() {
  console.log('🚀 Запуск тестов API отчетов...\n');
  
  // Проверяем доступность сервера
  try {
    const healthCheck = await makeRequest('GET', '/api/health');
    if (healthCheck.status !== 200) {
      console.log('❌ Сервер недоступен. Убедитесь, что сервер запущен на порту', PORT);
      return;
    }
  } catch (error) {
    console.log('❌ Не удается подключиться к серверу:', error.message);
    console.log('   Убедитесь, что сервер запущен командой: npm run dev');
    return;
  }
  
  const tests = [
    { name: 'Аутентификация', fn: authenticate },
    { name: 'Отчет по заказам', fn: testOrdersReport },
    { name: 'Отчет по остаткам', fn: testInventoryReport },
    { name: 'Отчет по движению', fn: testMovementReport },
    { name: 'Дашборд', fn: testDashboard },
    { name: 'Сводка отчетов', fn: testReportSummary },
    { name: 'Экспорт отчетов', fn: testReportExport },
    { name: 'Фильтрация отчетов', fn: testReportFiltering }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Ошибка в тесте "${test.name}":`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Результаты тестирования:');
  console.log(`✅ Пройдено: ${passed}`);
  console.log(`❌ Провалено: ${failed}`);
  console.log(`📈 Успешность: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 Все тесты пройдены успешно! Система отчетов работает корректно.');
  } else {
    console.log('\n⚠️  Некоторые тесты провалились. Проверьте логи выше для деталей.');
  }
}

// Запуск тестов
runTests().catch(console.error);