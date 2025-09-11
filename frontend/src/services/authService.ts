import httpClient from './httpClient';
import { LoginCredentials, AuthResponse, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } catch (error) {
      // Игнорируем ошибки при logout, так как токен может быть уже недействительным
      console.warn('Logout request failed:', error);
    } finally {
      // Всегда очищаем локальное хранилище
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await httpClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });
    
    return response.data.accessToken;
  },

  async getProfile(): Promise<User> {
    const response = await httpClient.get<User>('/auth/profile');
    return response.data;
  },

  // Утилитарные методы для работы с токенами
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  storeAuthData(authData: AuthResponse): void {
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    localStorage.setItem('user', JSON.stringify(authData.user));
  },

  clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

export default authService;