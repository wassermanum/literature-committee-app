import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, UserRole } from '../utils/jwt.js';

const prisma = new PrismaClient();

describe('Order API', () => {
  let authToken: string;
  let testOrganization1: any;
  let testOrganization2: any;
  let testUser: any;
  let testLiterature: any;

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
        name: 'Test Order Organization 1',
        type: 'GROUP',
        address: 'Test Address 1',
        contactPerson: 'Test Contact 1',
        phone: '+1234567890',
        email: 'test-order1@organization.com',
      },
    });

    testOrganization2 = await prisma.organization.create({
      data: {
        name: 'Test Order Organization 2',
        type: 'LOCALITY',
        address: 'Test Address 2',
        contactPerson: 'Test Contact 2',
        phone: '+1234567891',
        email: 'test-order2@organization.com',
      },
    });

    // Создаем тестового пользователя для аутентификации
    const hashedPassword = await hashPassword('testpassword');
    testUser = await prisma.user.create({
      data: {
        email: 'admin-order@test.com',
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
        title: 'Test Order Literature',
        description: 'This is test literature for order testing',
        category: 'Books',
        price: 25.99,
      },
    });

    // Создаем остатки на складе для тестов
    await prisma.inventory.create({
      data: {
        organizationId: testOrganization2.id,
        literatureId: testLiterature.id,
        quantity: 100,
        reservedQuantity: 0,
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

  describe('GET /api/orders', () => {
    let testOrder: any;

    beforeEach(async () => {
      // Создаем тестовый заказ для каждого теста
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-001',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          notes: 'Test order',
          createdById: testUser.id,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: testOrder.id,
          literatureId: testLiterature.id,
          quantity: 1,
          unitPrice: 25.99,
          totalPrice: 25.99,
        },
      });
    });

    afterEach(async () => {
      await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.delete({ where: { id: testOrder.id } });
    });

    it('should return all orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((order: any) => {
        expect(order.status).toBe('DRAFT');
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders')
        .expect(401);
    });
  });

  describe('GET /api/orders/:id', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-002',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          createdById: testUser.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.order.delete({ where: { id: testOrder.id } });
    });

    it('should return order by id', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrder.id);
      expect(response.body.data.orderNumber).toBe(testOrder.orderNumber);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app)
        .get('/api/orders/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/orders', () => {
    it('should create new order', async () => {
      const orderData = {
        fromOrganizationId: testOrganization1.id,
        toOrganizationId: testOrganization2.id,
        items: [
          {
            literatureId: testLiterature.id,
            quantity: 2,
          },
        ],
        notes: 'Test order creation',
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fromOrganization.id).toBe(orderData.fromOrganizationId);
      expect(response.body.data.toOrganization.id).toBe(orderData.toOrganizationId);
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.totalAmount).toBe(51.98); // 25.99 * 2

      // Очищаем созданный заказ
      await prisma.orderItem.deleteMany({ where: { orderId: response.body.data.id } });
      await prisma.order.delete({ where: { id: response.body.data.id } });
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        fromOrganizationId: testOrganization1.id,
        // missing required fields
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should validate item quantities', async () => {
      const invalidData = {
        fromOrganizationId: testOrganization1.id,
        toOrganizationId: testOrganization2.id,
        items: [
          {
            literatureId: testLiterature.id,
            quantity: 0, // invalid quantity
          },
        ],
      };

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-003',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          createdById: testUser.id,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: testOrder.id,
          literatureId: testLiterature.id,
          quantity: 1,
          unitPrice: 25.99,
          totalPrice: 25.99,
        },
      });
    });

    afterEach(async () => {
      await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
      await prisma.order.delete({ where: { id: testOrder.id } });
    });

    it('should update order status', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PENDING' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should validate status transitions', async () => {
      // Try to set invalid status transition
      await request(app)
        .put(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' }) // invalid transition from DRAFT
        .expect(400);
    });

    it('should validate status values', async () => {
      await request(app)
        .put(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  describe('POST /api/orders/:id/lock', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-004',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          createdById: testUser.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.order.delete({ where: { id: testOrder.id } });
    });

    it('should lock order', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrder.id}/lock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lockedAt).toBeTruthy();
      expect(response.body.data.lockedBy.id).toBe(testUser.id);
    });

    it('should prevent locking already locked order', async () => {
      // Lock the order first
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { 
          lockedAt: new Date(),
          lockedById: testUser.id,
        },
      });

      await request(app)
        .post(`/api/orders/${testOrder.id}/lock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /api/orders/:id/unlock', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-005',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          createdById: testUser.id,
          lockedAt: new Date(),
          lockedById: testUser.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.order.delete({ where: { id: testOrder.id } });
    });

    it('should unlock order', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrder.id}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lockedAt).toBeNull();
      expect(response.body.data.lockedBy).toBeNull();
    });

    it('should prevent unlocking non-locked order', async () => {
      // Unlock the order first
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { 
          lockedAt: null,
          lockedById: null,
        },
      });

      await request(app)
        .post(`/api/orders/${testOrder.id}/unlock`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/orders/organization/:organizationId', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-006',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          createdById: testUser.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.order.delete({ where: { id: testOrder.id } });
    });

    it('should return orders from organization', async () => {
      const response = await request(app)
        .get(`/api/orders/organization/${testOrganization1.id}?type=from`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((order: any) => {
        expect(order.fromOrganization.id).toBe(testOrganization1.id);
      });
    });

    it('should return orders to organization', async () => {
      const response = await request(app)
        .get(`/api/orders/organization/${testOrganization2.id}?type=to`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      response.body.data.forEach((order: any) => {
        expect(order.toOrganization.id).toBe(testOrganization2.id);
      });
    });
  });

  describe('GET /api/orders/statistics', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-007',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          createdById: testUser.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.order.delete({ where: { id: testOrder.id } });
    });

    it('should return order statistics', async () => {
      const response = await request(app)
        .get('/api/orders/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('byStatus');
      expect(Array.isArray(response.body.data.byStatus)).toBe(true);
    });

    it('should filter statistics by organization', async () => {
      const response = await request(app)
        .get(`/api/orders/statistics?organizationId=${testOrganization1.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('byStatus');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await prisma.order.create({
        data: {
          orderNumber: 'TEST-ORDER-008',
          fromOrganizationId: testOrganization1.id,
          toOrganizationId: testOrganization2.id,
          status: 'DRAFT',
          totalAmount: 25.99,
          createdById: testUser.id,
        },
      });
    });

    afterEach(async () => {
      // Проверяем, существует ли заказ перед удалением
      const existingOrder = await prisma.order.findUnique({ where: { id: testOrder.id } });
      if (existingOrder) {
        await prisma.order.delete({ where: { id: testOrder.id } });
      }
    });

    it('should delete order in DRAFT status', async () => {
      const response = await request(app)
        .delete(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
    });

    it('should not delete order in non-DRAFT status', async () => {
      // Update order to PENDING status
      await prisma.order.update({
        where: { id: testOrder.id },
        data: { status: 'PENDING' },
      });

      await request(app)
        .delete(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app)
        .delete('/api/orders/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});