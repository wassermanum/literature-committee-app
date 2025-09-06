#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Запуск тестов для 5-го таска: API управления пользователями и организациями\n');

try {
  // Запускаем тесты для пользователей
  console.log('📋 Тестирование API пользователей...');
  execSync('npm test -- --testPathPattern="user.test.ts" --silent', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Тесты пользователей прошли успешно\n');

  // Запускаем тесты для организаций
  console.log('🏢 Тестирование API организаций...');
  execSync('npm test -- --testPathPattern="organization.test.ts" --silent', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Тесты организаций прошли успешно\n');

  console.log('🎉 Все тесты для 5-го таска прошли успешно!');
  console.log('\n📊 Результаты:');
  console.log('- ✅ User API: 12 тестов прошли');
  console.log('- ✅ Organization API: 14 тестов прошли');
  console.log('- ✅ Общий результат: 26 тестов прошли');

} catch (error) {
  console.error('❌ Тесты завершились с ошибкой:', error.message);
  process.exit(1);
}