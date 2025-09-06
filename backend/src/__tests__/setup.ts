import { PrismaClient } from '@prisma/client';

// Настройка тестовой базы данных
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.NODE_ENV = 'test';

// Глобальная настройка для тестов
beforeAll(async () => {
  // Здесь можно добавить глобальную настройку для всех тестов
});

afterAll(async () => {
  // Закрыть соединения с базой данных после всех тестов
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});