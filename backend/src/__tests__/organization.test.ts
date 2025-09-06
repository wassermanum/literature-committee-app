import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, UserRole } from '../utils/jwt.js';

const prisma = new PrismaClient();

describe('Organization API', () => {
  let authToken: string;
  let testOrganization: any;
  let testUser: any;

  beforeAll(async () => {
    // Очищаем базу данных перед тестами
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
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
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');

    // Создаем тестовую организацию
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Org Organization',
        type: 'REGION',
        address: 'Test Address',
        contactPerson: 'Test Contact',
        phone: '+1234567890',
        email: 'test-org@organization.com',
      },
    });

    // Создаем тестового пользователя для аутентификации
    const hashedPassword = await hashPassword('testpassword');
    testUser = await prisma.user.create({
      data: {
        email: 'admin-org@test.com',
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
  });

  afterAll(async () => {
    // Очищаем тестовые данные
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
    await prisma.$disconnect();
  });

  describe('GET /api/organizations', () => {
    it('should return all organizations', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/organizations')
        .expect(401);
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('should return organization by id', async () => {
      const response = await request(app)
        .get(`/api/organizations/${testOrganization.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrganization.id);
      expect(response.body.data.name).toBe(testOrganization.name);
    });

    it('should return 404 for non-existent organization', async () => {
      await request(app)
        .get('/api/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/organizations', () => {
    it('should create a new organization', async () => {
      const organizationData = {
        name: 'New Test Organization',
        type: 'LOCALITY',
        parentId: testOrganization.id,
        address: 'New Test Address',
        contactPerson: 'New Contact Person',
        phone: '+9876543210',
        email: 'neworg@test.com',
      };

      const response = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(organizationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(organizationData.name);
      expect(response.body.data.type).toBe(organizationData.type);
      expect(response.body.data.parent.id).toBe(testOrganization.id);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        name: 'Incomplete Organization',
        // missing required fields
      };

      await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should validate organization hierarchy', async () => {
      const invalidHierarchyData = {
        name: 'Invalid Hierarchy Org',
        type: 'REGION', // REGION cannot be child of REGION
        parentId: testOrganization.id,
        address: 'Test Address',
        contactPerson: 'Test Contact',
        phone: '+1234567890',
        email: 'invalid@test.com',
      };

      await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidHierarchyData)
        .expect(400);
    });
  });

  describe('PUT /api/organizations/:id', () => {
    let organizationToUpdate: any;

    beforeEach(async () => {
      organizationToUpdate = await prisma.organization.create({
        data: {
          name: 'Update Test Organization',
          type: 'LOCALITY',
          parentId: testOrganization.id,
          address: 'Update Test Address',
          contactPerson: 'Update Contact',
          phone: '+1111111111',
          email: 'update@test.com',
        },
      });
    });

    afterEach(async () => {
      await prisma.organization.delete({
        where: { id: organizationToUpdate.id },
      });
    });

    it('should update organization data', async () => {
      const updateData = {
        name: 'Updated Organization Name',
        contactPerson: 'Updated Contact Person',
      };

      const response = await request(app)
        .put(`/api/organizations/${organizationToUpdate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.contactPerson).toBe(updateData.contactPerson);
    });

    it('should return 404 for non-existent organization', async () => {
      await request(app)
        .put('/api/organizations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('GET /api/organizations/type/:type', () => {
    beforeEach(async () => {
      // Создаем организации разных типов для тестирования
      await prisma.organization.create({
        data: {
          name: 'Test Group',
          type: 'GROUP',
          parentId: testOrganization.id,
          address: 'Group Address',
          contactPerson: 'Group Contact',
          phone: '+2222222222',
          email: 'group@test.com',
        },
      });
    });

    afterEach(async () => {
      await prisma.organization.deleteMany({
        where: {
          name: 'Test Group',
        },
      });
    });

    it('should return organizations by type', async () => {
      const response = await request(app)
        .get('/api/organizations/type/GROUP')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((org: any) => {
        expect(org.type).toBe('GROUP');
      });
    });

    it('should validate organization type', async () => {
      await request(app)
        .get('/api/organizations/type/INVALID_TYPE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/organizations/:id/hierarchy', () => {
    let childOrganization: any;

    beforeEach(async () => {
      childOrganization = await prisma.organization.create({
        data: {
          name: 'Child Organization',
          type: 'LOCALITY',
          parentId: testOrganization.id,
          address: 'Child Address',
          contactPerson: 'Child Contact',
          phone: '+3333333333',
          email: 'child@test.com',
        },
      });
    });

    afterEach(async () => {
      await prisma.organization.delete({
        where: { id: childOrganization.id },
      });
    });

    it('should return organization hierarchy', async () => {
      const response = await request(app)
        .get(`/api/organizations/${testOrganization.id}/hierarchy`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrganization.id);
      expect(response.body.data.children).toBeDefined();
      expect(Array.isArray(response.body.data.children)).toBe(true);
    });
  });

  describe('DELETE /api/organizations/:id', () => {
    let organizationToDelete: any;

    beforeEach(async () => {
      organizationToDelete = await prisma.organization.create({
        data: {
          name: 'Delete Test Organization',
          type: 'GROUP',
          address: 'Delete Test Address',
          contactPerson: 'Delete Contact',
          phone: '+4444444444',
          email: 'delete@test.com',
        },
      });
    });

    it('should deactivate organization', async () => {
      const response = await request(app)
        .delete(`/api/organizations/${organizationToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Проверяем, что организация деактивирована
      const deactivatedOrg = await prisma.organization.findUnique({
        where: { id: organizationToDelete.id },
      });
      expect(deactivatedOrg?.isActive).toBe(false);
    });

    it('should prevent deletion of organization with active users', async () => {
      // Создаем пользователя в организации
      const hashedPassword = await hashPassword('userpassword');
      const userInOrg = await prisma.user.create({
        data: {
          email: 'user@deleteorg.com',
          password: hashedPassword,
          firstName: 'User',
          lastName: 'InOrg',
          role: 'GROUP',
          organizationId: organizationToDelete.id,
        },
      });

      await request(app)
        .delete(`/api/organizations/${organizationToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Очищаем тестовые данные
      await prisma.user.delete({ where: { id: userInOrg.id } });
    });
  });
});