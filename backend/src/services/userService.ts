import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organizationId?: string;
  isActive?: boolean;
}

export class UserService {
  async getAllUsers() {
    return await prisma.user.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            parent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Убираем пароль из ответа
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(userData: CreateUserData) {
    // Проверяем, что email уникален
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Проверяем, что организация существует
    const organization = await prisma.organization.findUnique({
      where: { id: userData.organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role as any, // Type assertion for enum compatibility
        organizationId: userData.organizationId,
        password: hashedPassword,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Убираем пароль из ответа
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, userData: UpdateUserData) {
    // Проверяем, что пользователь существует
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Если обновляется email, проверяем уникальность
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (emailExists) {
        throw new Error('User with this email already exists');
      }
    }

    // Если обновляется организация, проверяем её существование
    if (userData.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: userData.organizationId },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        ...(userData.role && { role: userData.role as any }),
        ...(userData.organizationId && { organizationId: userData.organizationId }),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Убираем пароль из ответа
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deleteUser(id: string) {
    // Проверяем, что пользователь существует
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Вместо физического удаления, деактивируем пользователя
    // для сохранения истории операций
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }

  async getUsersByOrganization(organizationId: string) {
    return await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async getUsersByRole(role: string) {
    return await prisma.user.findMany({
      where: {
        role: role as any,
        isActive: true,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async assignRole(userId: string, role: string) {
    // Проверяем, что пользователь существует
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Валидируем роль
    const validRoles = ['GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION', 'ADMIN'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Убираем пароль из ответа
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}