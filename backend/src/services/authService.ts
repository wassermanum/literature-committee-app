import { PrismaClient, User } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, generateRefreshToken, JWTPayload, UserRole } from '../utils/jwt.js';

const prisma = new PrismaClient();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Найти пользователя по email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Проверить пароль
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Создать токены
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId,
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role, organizationId } = data;

    // Проверить, что пользователь с таким email не существует
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Проверить, что организация существует
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Хешировать пароль
    const hashedPassword = await hashPassword(password);

    // Создать пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        organizationId,
      },
    });

    // Создать токены
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId,
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        organizationId: user.organizationId,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Создать новый access token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId,
    };

    const accessToken = generateToken(payload);

    return { accessToken };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Проверить текущий пароль
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Хешировать новый пароль
    const hashedNewPassword = await hashPassword(newPassword);

    // Обновить пароль
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  async getUserProfile(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });
  }
}