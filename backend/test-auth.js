// Простой скрипт для тестирования API аутентификации
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  console.log('🧪 Тестирование API аутентификации...\n');

  try {
    // 1. Проверка health endpoint
    console.log('1. Проверка health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);

    // 2. Тест регистрации (должен вернуть ошибку, так как пользователь уже существует)
    console.log('\n2. Тест регистрации...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@siberia-na.org',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: 'some-org-id'
      })
    });
    const registerData = await registerResponse.json();
    console.log('📝 Register response:', registerData.message || registerData.error);

    // 3. Тест входа
    console.log('\n3. Тест входа...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@siberia-na.org',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Вход успешен для пользователя:', loginData.data.user.email);
      
      const token = loginData.data.accessToken;
      
      // 4. Тест получения профиля
      console.log('\n4. Тест получения профиля...');
      const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Профиль получен:', `${profileData.data.firstName} ${profileData.data.lastName}`);
      } else {
        console.log('❌ Ошибка получения профиля');
      }
      
    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Ошибка входа:', loginError.message);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запуск тестов
testAuth();