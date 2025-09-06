import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, UserRole } from '../utils/jwt.js';

const prisma = new PrismaClient();

describe('Report API', () => {
  let authToken: string;
  let testOrganization1: any;
  let testOrganization2: any;
  let testUser: any;
  let testLiterature: any;
  let testOrder: any;

  beforeAll(async () => {
    // Очищаем базу данных перед тестами
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.literature.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Создаем тестовые организации
    testOrganization1 = await prisma.organization.create({
      data: {
        name: 'Test Report Organization 1',
        type: 'GROUP',
        address: 'Test Address 1',
        contactPerson: 'Test Contact 1',
        phone: '+1234567890',
        email: 'test-report1@organization.com',
      },
    });

    testOrganization2 = await prisma.organization.create({
      data: {
        name: 'Test Report Organization 2',
        type: 'LOCALITY',
        address: 'Test Address 2',
        contactPerson: 'Test Contact 2',
        phone: '+1234567891',
        email: 'test-report2@organization.com',
      },
    });

    // Создаем тестового пользователя для аутентификации
    const hashedPassword = await hashPassword('testpassword');
    testUser = await prisma.user.create({
      data: {
        email: 'admin-report@test.com',
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
        title: 'Test Report Literature',
        description: 'This is test literature for report testing',
        category: 'Books',
        price: 25.99,
      },
    });

    // Создаем тестовые данные для отчетов
    await prisma.inventory.create({
      data: {
        organizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantity: 100,
        reservedQuantity: 10,
      },
    });

    await prisma.inventory.create({
      data: {
        organizationId: testOrganization2.id,
        literatureId: testLiterature.id,
        quantity: 50,
        reservedQuantity: 5,
      },
    });

    // Создаем тестовый заказ
    testOrder = await prisma.order.create({
      data: {
        orderNumber: 'TEST-REPORT-001',
        fromOrganizationId: testOrganization1.id,
        toOrganizationId: testOrganization2.id,
        status: 'COMPLETED',
        totalAmount: 51.98,
        createdById: testUser.id,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: testOrder.id,
        literatureId: testLiterature.id,
        quantity: 2,
        unitPrice: 25.99,
        totalPrice: 51.98,
      },
    });

    // Создаем тестовую транзакцию
    await prisma.transaction.create({
      data: {
        type: 'OUTGOING',
        fromOrganizationId: testOrganization2.id,
        toOrganizationId: testOrganization1.id,
        literatureId: testLiterature.id,
        quantity: 2,
        unitPrice: 25.99,
        totalAmount: 51.98,
        orderId: testOrder.id,
        notes: 'Test transaction for reports',
      },
    });
  });

  afterAll(async () => {
    // Очищаем тестовые данные
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.literature.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
    await prisma.$disconnect();
  });

  describe('GET /api/reports/orders', () => {
    it('should return orders report', async () => {
      const response = await request(app)
        .get('/api/reports/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(response.body.data).toHaveProperty('byOrganization');
      expect(response.body.data.summary.totalOrders).toBeGreaterThan(0);
    });

    it('should filter orders report by organization', async () => {
      const response = await request(app)
        .get(`/api/reports/orders?organizationId=${testOrganization1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalOrders).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/reports/orders')
        .expect(401);
    });
  });

  describe('GET /api/reports/inventory', () => {
    it('should return inventory report', async () => {
      const response = await request(app)
        .get('/api/reports/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('byOrganization');
      expect(response.body.data).toHaveProperty('byCategory');
      expect(response.body.data.summary.totalItems).toBeGreaterThan(0);
    });
  });

  describe('GET /api/reports/movement', () => {
    it('should return movement report', async () => {
      const response = await request(app)
        .get('/api/reports/movement')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('byType');
    });
  });

  describe('GET /api/reports/dashboard', () => {
    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('orders');
      expect(response.body.data).toHaveProperty('inventory');
      expect(response.body.data).toHaveProperty('movement');
    });
  });

  describe('GET /api/reports/export/:type', () => {
    it('should export orders report as CSV', async () => {
      const response = await request(app)
        .get('/api/reports/export/orders?format=csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return error for invalid report type', async () => {
      const response = await request(app)
        .get('/api/reports/export/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid report type');
    });
  });
});