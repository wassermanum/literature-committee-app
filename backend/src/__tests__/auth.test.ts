import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../server.js';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';

const prisma = new PrismaClient();

describe('Authentication', () => {
  beforeAll(async () => {
    // Создать тестовую организацию, если её нет
    const existingOrg = await prisma.organization.findUnique({
      where: { id: 'test-org-1' }
    });
    
    if (!existingOrg) {
      await prisma.organization.create({
        data: {
          id: 'test-org-1',
          name: 'Test Organization',
          type: 'GROUP',
          address: 'Test Address',
          contactPerson: 'Test Person',
          phone: '+7 123 456 7890',
          email: 'test@example.com',
        },
      });
    }
  });

  afterAll(async () => {
    // Очистить только пользователей
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });



  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'GROUP',
        organizationId: 'test-org-1',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      // Сначала создаем пользователя
      const firstUser = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'User',
        role: 'GROUP',
        organizationId: 'test-org-1',
      };

      await request(app)
        .post('/api/auth/register')
        .send(firstUser)
        .expect(201);

      // Теперь пытаемся создать пользователя с тем же email
      const duplicateUser = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Second',
        lastName: 'User',
        role: 'GROUP',
        organizationId: 'test-org-1',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Сначала создаем пользователя
      const userData = {
        email: 'login-test@example.com',
        password: 'password123',
        firstName: 'Login',
        lastName: 'Test',
        role: 'GROUP',
        organizationId: 'test-org-1',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Теперь пытаемся войти
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login-test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should not login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Создать пользователя и получить токен для тестов
      const userData = {
        email: 'profile-test@example.com',
        password: 'password123',
        firstName: 'Profile',
        lastName: 'Test',
        role: 'GROUP',
        organizationId: 'test-org-1',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'profile-test@example.com',
          password: 'password123',
        });
      
      accessToken = response.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('profile-test@example.com');
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Создать пользователя и получить токен для тестов
      const userData = {
        email: 'password-test@example.com',
        password: 'password123',
        firstName: 'Password',
        lastName: 'Test',
        role: 'GROUP',
        organizationId: 'test-org-1',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password-test@example.com',
          password: 'password123',
        });
      
      accessToken = response.body.data.accessToken;
    });

    it('should change password with valid current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');
    });

    it('should not change password with wrong current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrect');
    });
  });
});