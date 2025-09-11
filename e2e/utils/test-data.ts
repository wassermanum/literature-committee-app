// Тестовые данные для E2E тестов
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Админ',
    lastName: 'Тестовый',
    role: 'admin'
  },
  regionUser: {
    email: 'region@test.com',
    password: 'region123',
    firstName: 'Регион',
    lastName: 'Пользователь',
    role: 'region'
  },
  localityUser: {
    email: 'locality@test.com',
    password: 'locality123',
    firstName: 'Местность',
    lastName: 'Пользователь',
    role: 'locality'
  },
  groupUser: {
    email: 'group@test.com',
    password: 'group123',
    firstName: 'Группа',
    lastName: 'Пользователь',
    role: 'group'
  }
};

export const testOrganizations = {
  region: {
    name: 'Тестовый Регион Сибирь',
    type: 'region',
    address: 'г. Новосибирск, ул. Тестовая, 1',
    contactPerson: 'Иванов И.И.',
    phone: '+7-999-123-45-67',
    email: 'region@test.com'
  },
  locality: {
    name: 'Тестовая Местность Новосибирск',
    type: 'locality',
    address: 'г. Новосибирск, ул. Местная, 2',
    contactPerson: 'Петров П.П.',
    phone: '+7-999-234-56-78',
    email: 'locality@test.com'
  },
  group: {
    name: 'Тестовая Группа Надежда',
    type: 'group',
    address: 'г. Новосибирск, ул. Групповая, 3',
    contactPerson: 'Сидоров С.С.',
    phone: '+7-999-345-67-89',
    email: 'group@test.com'
  }
};

export const testLiterature = [
  {
    title: 'Базовый текст',
    description: 'Основная литература АН',
    category: 'Основная литература',
    price: 150.00
  },
  {
    title: 'Информационные брошюры',
    description: 'Информационные материалы для новичков',
    category: 'Информационные материалы',
    price: 50.00
  },
  {
    title: 'Рабочие тетради',
    description: 'Рабочие тетради для работы по шагам',
    category: 'Рабочие материалы',
    price: 200.00
  }
];

export const testInventory = [
  {
    literatureTitle: 'Базовый текст',
    regionQuantity: 100,
    localityQuantity: 50,
    groupQuantity: 10
  },
  {
    literatureTitle: 'Информационные брошюры',
    regionQuantity: 200,
    localityQuantity: 100,
    groupQuantity: 20
  },
  {
    literatureTitle: 'Рабочие тетради',
    regionQuantity: 80,
    localityQuantity: 30,
    groupQuantity: 5
  }
];