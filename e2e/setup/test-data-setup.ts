import { test as setup } from '@playwright/test';
import { testUsers, testOrganizations, testLiterature, testInventory } from '../utils/test-data';

// Глобальная настройка тестовых данных
setup('Подготовка тестовых данных', async ({ request }) => {
  const baseURL = 'http://localhost:3000/api';

  // Очищаем существующие тестовые данные
  await request.post(`${baseURL}/test/cleanup`);

  // Создаем тестовые организации
  for (const [key, org] of Object.entries(testOrganizations)) {
    const response = await request.post(`${baseURL}/organizations`, {
      data: org
    });
    
    if (!response.ok()) {
      console.error(`Ошибка создания организации ${key}:`, await response.text());
    }
  }

  // Создаем тестовых пользователей
  for (const [key, user] of Object.entries(testUsers)) {
    // Находим ID организации для пользователя
    let organizationId: string;
    
    switch (user.role) {
      case 'admin':
        organizationId = 'admin'; // Специальный случай для админа
        break;
      case 'region':
        organizationId = await getOrganizationId(request, baseURL, 'Тестовый Регион Сибирь');
        break;
      case 'locality':
        organizationId = await getOrganizationId(request, baseURL, 'Тестовая Местность Новосибирск');
        break;
      case 'group':
        organizationId = await getOrganizationId(request, baseURL, 'Тестовая Группа Надежда');
        break;
      default:
        organizationId = await getOrganizationId(request, baseURL, 'Тестовая Группа Надежда');
    }

    const userData = {
      ...user,
      organizationId
    };

    const response = await request.post(`${baseURL}/users`, {
      data: userData
    });
    
    if (!response.ok()) {
      console.error(`Ошибка создания пользователя ${key}:`, await response.text());
    }
  }

  // Создаем тестовую литературу
  for (const literature of testLiterature) {
    const response = await request.post(`${baseURL}/literature`, {
      data: literature
    });
    
    if (!response.ok()) {
      console.error(`Ошибка создания литературы ${literature.title}:`, await response.text());
    }
  }

  // Настраиваем остатки на складах
  for (const inventory of testInventory) {
    const literatureId = await getLiteratureId(request, baseURL, inventory.literatureTitle);
    
    // Остатки для региона
    const regionOrgId = await getOrganizationId(request, baseURL, 'Тестовый Регион Сибирь');
    await request.post(`${baseURL}/inventory`, {
      data: {
        organizationId: regionOrgId,
        literatureId,
        quantity: inventory.regionQuantity
      }
    });

    // Остатки для местности
    const localityOrgId = await getOrganizationId(request, baseURL, 'Тестовая Местность Новосибирск');
    await request.post(`${baseURL}/inventory`, {
      data: {
        organizationId: localityOrgId,
        literatureId,
        quantity: inventory.localityQuantity
      }
    });

    // Остатки для группы
    const groupOrgId = await getOrganizationId(request, baseURL, 'Тестовая Группа Надежда');
    await request.post(`${baseURL}/inventory`, {
      data: {
        organizationId: groupOrgId,
        literatureId,
        quantity: inventory.groupQuantity
      }
    });
  }

  console.log('Тестовые данные успешно созданы');
});

async function getOrganizationId(request: any, baseURL: string, name: string): Promise<string> {
  const response = await request.get(`${baseURL}/organizations?name=${encodeURIComponent(name)}`);
  const organizations = await response.json();
  
  if (organizations.length === 0) {
    throw new Error(`Организация "${name}" не найдена`);
  }
  
  return organizations[0].id;
}

async function getLiteratureId(request: any, baseURL: string, title: string): Promise<string> {
  const response = await request.get(`${baseURL}/literature?title=${encodeURIComponent(title)}`);
  const literature = await response.json();
  
  if (literature.length === 0) {
    throw new Error(`Литература "${title}" не найдена`);
  }
  
  return literature[0].id;
}