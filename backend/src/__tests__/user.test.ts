import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, UserRole } from '../utils/jwt.js';

const prisma = new PrismaClient();

describe('User API', () => {
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
        name: 'Test User Organization',
        type: 'LOCALITY',
        address: 'Test Address',
        contactPerson: 'Test Contact',
        phone: '+1234567890',
        email: 'test-user@organization.com',
      },
    });

    // Создаем тестового пользователя для аутентификации
    const hashedPassword = await hashPassword('testpassword');
    testUser = await prisma.user.create({
      data: {
        email: 'admin-user@test.com',
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

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Проверяем, что пароли не возвращаются
      response.body.data.forEach((user: any) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'newpassword123',
        firstName: 'New',
        lastName: 'User',
        role: 'GROUP',
        organizationId: testOrganization.id,
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.firstName).toBe(userData.firstName);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'incomplete@test.com',
        // missing required fields
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });

    it('should prevent duplicate emails', async () => {
      const userData = {
        email: testUser.email, // duplicate email
        password: 'password123',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'GROUP',
        organizationId: testOrganization.id,
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    let userToUpdate: any;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('updatepassword');
      userToUpdate = await prisma.user.create({
        data: {
          email: 'update@test.com',
          password: hashedPassword,
          firstName: 'Update',
          lastName: 'User',
          role: 'GROUP',
          organizationId: testOrganization.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.user.delete({
        where: { id: userToUpdate.id },
      });
    });

    it('should update user data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .put(`/api/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    let userForRole: any;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('rolepassword');
      userForRole = await prisma.user.create({
        data: {
          email: 'role@test.com',
          password: hashedPassword,
          firstName: 'Role',
          lastName: 'User',
          role: 'GROUP',
          organizationId: testOrganization.id,
        },
      });
    });

    afterEach(async () => {
      await prisma.user.delete({
        where: { id: userForRole.id },
      });
    });

    it('should assign role to user', async () => {
      const response = await request(app)
        .put(`/api/users/${userForRole.id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'LOCALITY' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('LOCALITY');
    });

    it('should validate role', async () => {
      await request(app)
        .put(`/api/users/${userForRole.id}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'INVALID_ROLE' })
        .expect(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let userToDelete: any;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('deletepassword');
      userToDelete = await prisma.user.create({
        data: {
          email: 'delete@test.com',
          password: hashedPassword,
          firstName: 'Delete',
          lastName: 'User',
          role: 'GROUP',
          organizationId: testOrganization.id,
        },
      });
    });

    it('should deactivate user', async () => {
      const response = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Проверяем, что пользователь деактивирован
      const deactivatedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(deactivatedUser?.isActive).toBe(false);
    });
  });
});