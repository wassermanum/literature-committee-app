import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, UserRole } from '../utils/jwt.js';

const prisma = new PrismaClient();

describe('Literature API', () => {
  let authToken: string;
  let testOrganization: any;
  let testUser: any;
  let testLiterature: any;

  beforeAll(async () => {
    // Очищаем базу данных перед тестами
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.literature.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Применяем миграции для тестовой базы данных
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "parentId" TEXT,
        "address" TEXT NOT NULL,
        "contactPerson" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("parentId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "organizationId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "literature" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "price" REAL NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "inventory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL,
        "literatureId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 0,
        "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
        "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("literatureId") REFERENCES "literature" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        UNIQUE("organizationId", "literatureId")
      )
    `);
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Создаем тестовую организацию
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Literature Organization',
        type: 'REGION',
        address: 'Test Address',
        contactPerson: 'Test Contact',
        phone: '+1234567890',
        email: 'test-literature@organization.com',
      },
    });

    // Создаем тестового пользователя для аутентификации
    const hashedPassword = await hashPassword('testpassword');
    testUser = await prisma.user.create({
      data: {
        email: 'admin-literature@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: testOrganization.id,
      },
    });

    // Генерируем токен для аутентификации
    authToken = generateToken({ 
      userId: testUser.id, 
      email: testUser.email,
      role: testUser.role as UserRole,
      organizationId: testUser.organizationId
    });

    // Создаем тестовую литературу
    testLiterature = await prisma.literature.create({
      data: {
        title: 'Test Literature Book',
        description: 'This is a test literature book for testing purposes',
        category: 'Books',
        price: 15.99,
      },
    });
  });

  afterAll(async () => {
    // Очищаем тестовые данные
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.inventory.deleteMany({});
    await prisma.literature.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
    await prisma.$disconnect();
  });

  describe('GET /api/literature', () => {
    it('should return all literature', async () => {
      const response = await request(app)
        .get('/api/literature')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter literature by category', async () => {
      const response = await request(app)
        .get('/api/literature?category=Books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((item: any) => {
        expect(item.category).toBe('Books');
      });
    });

    it('should search literature by title', async () => {
      const response = await request(app)
        .get('/api/literature?search=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/literature')
        .expect(401);
    });
  });

  describe('GET /api/literature/:id', () => {
    it('should return literature by id', async () => {
      const response = await request(app)
        .get(`/api/literature/${testLiterature.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLiterature.id);
      expect(response.body.data.title).toBe(testLiterature.title);
    });

    it('should return 404 for non-existent literature', async () => {
      await request(app)
        .get('/api/literature/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/literature', () => {
    it('should create new literature', async () => {
      const literatureData = {
        title: 'New Test Book',
        description: 'This is a new test book for testing creation',
        category: 'Pamphlets',
        price: 5.99,
      };

      const response = await request(app)
        .post('/api/literature')
        .set('Authorization', `Bearer ${authToken}`)
        .send(literatureData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(literatureData.title);
      expect(response.body.data.category).toBe(literatureData.category);
      expect(response.body.data.price).toBe(literatureData.price);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        title: 'Incomplete Book',
        // missing required fields
      };

      await request(app)
        .post('/api/literature')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should validate price is not negative', async () => {
      const invalidData = {
        title: 'Invalid Price Book',
        description: 'Book with negative price',
        category: 'Books',
        price: -10,
      };

      await request(app)
        .post('/api/literature')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/literature/:id', () => {
    let literatureToUpdate: any;

    beforeEach(async () => {
      literatureToUpdate = await prisma.literature.create({
        data: {
          title: 'Update Test Book',
          description: 'Book to be updated',
          category: 'Books',
          price: 12.99,
        },
      });
    });

    afterEach(async () => {
      await prisma.literature.delete({
        where: { id: literatureToUpdate.id },
      });
    });

    it('should update literature data', async () => {
      const updateData = {
        title: 'Updated Book Title',
        price: 19.99,
      };

      const response = await request(app)
        .put(`/api/literature/${literatureToUpdate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.price).toBe(updateData.price);
    });

    it('should return 404 for non-existent literature', async () => {
      await request(app)
        .put('/api/literature/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test' })
        .expect(404);
    });
  });

  describe('GET /api/literature/categories', () => {
    it('should return literature categories', async () => {
      const response = await request(app)
        .get('/api/literature/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      response.body.data.forEach((category: any) => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('count');
      });
    });
  });

  describe('GET /api/literature/search', () => {
    it('should search literature', async () => {
      const response = await request(app)
        .get('/api/literature/search?q=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require search query', async () => {
      await request(app)
        .get('/api/literature/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/literature/category/:category', () => {
    it('should return literature by category', async () => {
      const response = await request(app)
        .get('/api/literature/category/Books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((item: any) => {
        expect(item.category).toBe('Books');
      });
    });
  });

  describe('PUT /api/literature/:id/inventory', () => {
    it('should update literature inventory', async () => {
      const inventoryData = {
        organizationId: testOrganization.id,
        quantity: 100,
        reservedQuantity: 10,
      };

      const response = await request(app)
        .put(`/api/literature/${testLiterature.id}/inventory`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(inventoryData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(inventoryData.quantity);
      expect(response.body.data.reservedQuantity).toBe(inventoryData.reservedQuantity);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        quantity: 50,
        // missing organizationId
      };

      await request(app)
        .put(`/api/literature/${testLiterature.id}/inventory`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('GET /api/literature/:id/inventory', () => {
    beforeEach(async () => {
      // Создаем запись в inventory для тестов
      await prisma.inventory.upsert({
        where: {
          organizationId_literatureId: {
            organizationId: testOrganization.id,
            literatureId: testLiterature.id,
          },
        },
        update: {
          quantity: 50,
          reservedQuantity: 5,
        },
        create: {
          organizationId: testOrganization.id,
          literatureId: testLiterature.id,
          quantity: 50,
          reservedQuantity: 5,
        },
      });
    });

    it('should return literature inventory', async () => {
      const response = await request(app)
        .get(`/api/literature/${testLiterature.id}/inventory`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter inventory by organization', async () => {
      const response = await request(app)
        .get(`/api/literature/${testLiterature.id}/inventory?organizationId=${testOrganization.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((item: any) => {
        expect(item.organizationId).toBe(testOrganization.id);
      });
    });
  });

  describe('DELETE /api/literature/:id', () => {
    let literatureToDelete: any;

    beforeEach(async () => {
      literatureToDelete = await prisma.literature.create({
        data: {
          title: 'Delete Test Book',
          description: 'Book to be deleted',
          category: 'Books',
          price: 8.99,
        },
      });
    });

    it('should deactivate literature', async () => {
      const response = await request(app)
        .delete(`/api/literature/${literatureToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Проверяем, что литература деактивирована
      const deactivatedLiterature = await prisma.literature.findUnique({
        where: { id: literatureToDelete.id },
      });
      expect(deactivatedLiterature?.isActive).toBe(false);
    });
  });
});