import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, UserRole } from '../utils/jwt.js';

const prisma = new PrismaClient();

describe('Transaction API', () => {
  let authToken: string;
  let testOrganization1: any;
  let testOrganization2: any;
  let testUser: any;
  let testLiterature: any;

  beforeAll(async () => {
    // Очищаем базу данных перед тестами
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.transaction.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.literature.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Создаем тестовые организации
    testOrganization1 = await prisma.organization.create({
      data: {
        name: 'Test Transaction Organization 1',
        type: 'REGION',
        address: 'Test Address 1',
        contactPerson: 'Test Contact 1',
        phone: '+1234567890',
        email: 'test-transaction1@organization.com',
      },
    });

    testOrganization2 = await prisma.organization.create({
      data: {
        name: 'Test Transaction Organization 2',
        type: 'LOCALITY',
        address: 'Test Address 2',
        contactPerson: 'Test Contact 2',
        phone: '+1234567891',
        email: 'test-transaction2@organization.com',
      },
    });

    // Создаем тестового пользователя для аутентификации
    const hashedPassword = await hashPassword('testpassword');
    testUser = await prisma.user.create({
      data: {
        email: 'admin-transaction@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        organizationId: testOrganization1.id,
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
        title: 'Test Transaction Literature',
        description: 'This is test literature for transaction testing',
        category: 'Books',
        price: 25.99,
      },
    });

    // Создаем остатки на складе для тестов
    await prisma.inventory.create({
      data: {
        organizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantity: 100,
        reservedQuantity: 0,
      },
    });
  });

  afterAll(async () => {
    // Очищаем тестовые данные
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.transaction.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.literature.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
    await prisma.$disconnect();
  });

  describe('GET /api/transactions', () => {
    let testTransaction: any;

    beforeEach(async () => {
      // Создаем тестовую транзакцию для каждого теста
      testTransaction = await prisma.transaction.create({
        data: {
          type: 'INCOMING',
          toOrganizationId: testOrganization1.id,
          literatureId: testLiterature.id,
          quantity: 10,
          unitPrice: 25.99,
          totalAmount: 259.90,
          notes: 'Test transaction',
        },
      });
    });

    afterEach(async () => {
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
    });

    it('should return all transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/transactions?type=INCOMING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((transaction: any) => {
        expect(transaction.type).toBe('INCOMING');
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/transactions')
        .expect(401);
    });
  });

  describe('GET /api/transactions/:id', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await prisma.transaction.create({
        data: {
          type: 'OUTGOING',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          literatureId: testLiterature.id,
          quantity: 5,
          unitPrice: 25.99,
          totalAmount: 129.95,
        },
      });
    });

    afterEach(async () => {
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
    });

    it('should return transaction by id', async () => {
      const response = await request(app)
        .get(`/api/transactions/${testTransaction.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTransaction.id);
      expect(response.body.data.type).toBe('OUTGOING');
    });

    it('should return 404 for non-existent transaction', async () => {
      await request(app)
        .get('/api/transactions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create incoming transaction', async () => {
      const transactionData = {
        type: 'INCOMING',
        toOrganizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantity: 20,
        unitPrice: 25.99,
        notes: 'Test incoming transaction',
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('INCOMING');
      expect(response.body.data.quantity).toBe(20);
      expect(response.body.data.totalAmount).toBe(519.80); // 20 * 25.99

      // Очищаем созданную транзакцию
      await prisma.transaction.delete({ where: { id: response.body.data.id } });
    });

    it('should create outgoing transaction', async () => {
      const transactionData = {
        type: 'OUTGOING',
        fromOrganizationId: testOrganization1.id,
        toOrganizationId: testOrganization2.id,
        literatureId: testLiterature.id,
        quantity: 5,
        notes: 'Test outgoing transaction',
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('OUTGOING');
      expect(response.body.data.quantity).toBe(5);

      // Очищаем созданную транзакцию
      await prisma.transaction.delete({ where: { id: response.body.data.id } });
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        type: 'INCOMING',
        // missing required fields
      };

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should validate transaction type', async () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        toOrganizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantity: 10,
      };

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate zero quantity', async () => {
      const invalidData = {
        type: 'INCOMING',
        toOrganizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantity: 0, // invalid quantity
      };

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should check sufficient inventory for outgoing transactions', async () => {
      const transactionData = {
        type: 'OUTGOING',
        fromOrganizationId: testOrganization1.id,
        toOrganizationId: testOrganization2.id,
        literatureId: testLiterature.id,
        quantity: 1000, // exceeds available quantity
      };

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transactionData)
        .expect(400);
    });
  });

  describe('POST /api/transactions/adjustment', () => {
    it('should create positive inventory adjustment', async () => {
      const adjustmentData = {
        organizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantityChange: 10,
        reason: 'Stock count correction',
        notes: 'Found additional items during inventory',
      };

      const response = await request(app)
        .post('/api/transactions/adjustment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(adjustmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('ADJUSTMENT');
      expect(response.body.data.quantity).toBe(10);

      // Проверяем, что остатки обновились
      const inventory = await prisma.inventory.findUnique({
        where: {
          organizationId_literatureId: {
            organizationId: testOrganization1.id,
            literatureId: testLiterature.id,
          },
        },
      });
      expect(inventory?.quantity).toBe(110); // 100 + 10

      // Очищаем созданную транзакцию и восстанавливаем остатки
      await prisma.transaction.delete({ where: { id: response.body.data.id } });
      await prisma.inventory.update({
        where: {
          organizationId_literatureId: {
            organizationId: testOrganization1.id,
            literatureId: testLiterature.id,
          },
        },
        data: { quantity: 100 },
      });
    });

    it('should create negative inventory adjustment', async () => {
      const adjustmentData = {
        organizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantityChange: -5,
        reason: 'Damaged items',
        notes: 'Items damaged during transport',
      };

      const response = await request(app)
        .post('/api/transactions/adjustment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(adjustmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('ADJUSTMENT');
      expect(response.body.data.quantity).toBe(-5);

      // Проверяем, что остатки обновились
      const inventory = await prisma.inventory.findUnique({
        where: {
          organizationId_literatureId: {
            organizationId: testOrganization1.id,
            literatureId: testLiterature.id,
          },
        },
      });
      expect(inventory?.quantity).toBe(95); // 100 - 5

      // Очищаем созданную транзакцию и восстанавливаем остатки
      await prisma.transaction.delete({ where: { id: response.body.data.id } });
      await prisma.inventory.update({
        where: {
          organizationId_literatureId: {
            organizationId: testOrganization1.id,
            literatureId: testLiterature.id,
          },
        },
        data: { quantity: 100 },
      });
    });

    it('should prevent negative inventory', async () => {
      const adjustmentData = {
        organizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantityChange: -150, // would result in negative inventory
        reason: 'Test negative adjustment',
      };

      await request(app)
        .post('/api/transactions/adjustment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(adjustmentData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        organizationId: testOrganization1.id,
        // missing required fields
      };

      await request(app)
        .post('/api/transactions/adjustment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('GET /api/transactions/organization/:organizationId', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await prisma.transaction.create({
        data: {
          type: 'INCOMING',
          toOrganizationId: testOrganization1.id,
          literatureId: testLiterature.id,
          quantity: 15,
          unitPrice: 25.99,
          totalAmount: 389.85,
        },
      });
    });

    afterEach(async () => {
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
    });

    it('should return transactions for organization', async () => {
      const response = await request(app)
        .get(`/api/transactions/organization/${testOrganization1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by transaction direction', async () => {
      const response = await request(app)
        .get(`/api/transactions/organization/${testOrganization1.id}?type=to`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((transaction: any) => {
        expect(transaction.toOrganization.id).toBe(testOrganization1.id);
      });
    });
  });

  describe('GET /api/transactions/statistics', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await prisma.transaction.create({
        data: {
          type: 'INCOMING',
          toOrganizationId: testOrganization1.id,
          literatureId: testLiterature.id,
          quantity: 25,
          unitPrice: 25.99,
          totalAmount: 649.75,
        },
      });
    });

    afterEach(async () => {
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
    });

    it('should return transaction statistics', async () => {
      const response = await request(app)
        .get('/api/transactions/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTransactions');
      expect(response.body.data).toHaveProperty('totalAmount');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('topLiterature');
      expect(Array.isArray(response.body.data.byType)).toBe(true);
      expect(Array.isArray(response.body.data.topLiterature)).toBe(true);
    });

    it('should filter statistics by organization', async () => {
      const response = await request(app)
        .get(`/api/transactions/statistics?organizationId=${testOrganization1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTransactions');
      expect(response.body.data).toHaveProperty('byType');
    });
  });

  describe('GET /api/transactions/movement-report', () => {
    let testTransaction: any;

    beforeEach(async () => {
      testTransaction = await prisma.transaction.create({
        data: {
          type: 'OUTGOING',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          literatureId: testLiterature.id,
          quantity: 8,
          unitPrice: 25.99,
          totalAmount: 207.92,
        },
      });
    });

    afterEach(async () => {
      await prisma.transaction.delete({ where: { id: testTransaction.id } });
    });

    it('should return movement report', async () => {
      const response = await request(app)
        .get('/api/transactions/movement-report')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(Array.isArray(response.body.data.summary)).toBe(true);
    });

    it('should filter movement report by organization', async () => {
      const response = await request(app)
        .get(`/api/transactions/movement-report?organizationId=${testOrganization1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('summary');
    });
  });
});