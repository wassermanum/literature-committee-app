import axios from 'axios';
import {
  User,
  Organization,
  CreateUserRequest,
  UpdateUserRequest,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  UserFilters,
  OrganizationFilters,
  UsersResponse,
  OrganizationsResponse,
  SystemSettings,
  UpdateSystemSettingRequest,
  RolePermission,
  UpdateRolePermissionRequest,
  AdminStats,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class AdminService {
  private baseURL = `${API_BASE_URL}/api`;

  // Управление пользователями
  async getUsers(
    page = 1,
    limit = 20,
    filters?: UserFilters
  ): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await axios.get(`${this.baseURL}/users?${params}`);
    return response.data;
  }

  async getUserById(id: string): Promise<User> {
    const response = await axios.get(`${this.baseURL}/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await axios.post(`${this.baseURL}/users`, data);
    return response.data;
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await axios.put(`${this.baseURL}/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/users/${id}`);
  }

  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    await axios.post(`${this.baseURL}/users/${id}/reset-password`, {
      password: newPassword,
    });
  }

  // Управление организациями
  async getOrganizations(
    page = 1,
    limit = 20,
    filters?: OrganizationFilters
  ): Promise<OrganizationsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await axios.get(`${this.baseURL}/organizations?${params}`);
    return response.data;
  }

  async getOrganizationById(id: string): Promise<Organization> {
    const response = await axios.get(`${this.baseURL}/organizations/${id}`);
    return response.data;
  }

  async createOrganization(data: CreateOrganizationRequest): Promise<Organization> {
    const response = await axios.post(`${this.baseURL}/organizations`, data);
    return response.data;
  }

  async updateOrganization(
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<Organization> {
    const response = await axios.put(`${this.baseURL}/organizations/${id}`, data);
    return response.data;
  }

  async deleteOrganization(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/organizations/${id}`);
  }

  async getOrganizationHierarchy(): Promise<Organization[]> {
    const response = await axios.get(`${this.baseURL}/organizations/hierarchy`);
    return response.data;
  }

  // Системные настройки
  async getSystemSettings(): Promise<SystemSettings[]> {
    const response = await axios.get(`${this.baseURL}/admin/settings`);
    return response.data;
  }

  async updateSystemSetting(
    key: string,
    data: UpdateSystemSettingRequest
  ): Promise<SystemSettings> {
    const response = await axios.put(`${this.baseURL}/admin/settings/${key}`, data);
    return response.data;
  }

  // Управление ролями и правами
  async getRolePermissions(): Promise<RolePermission[]> {
    const response = await axios.get(`${this.baseURL}/admin/permissions`);
    return response.data;
  }

  async updateRolePermission(
    id: string,
    data: UpdateRolePermissionRequest
  ): Promise<RolePermission> {
    const response = await axios.put(`${this.baseURL}/admin/permissions/${id}`, data);
    return response.data;
  }

  // Статистика и аналитика
  async getAdminStats(): Promise<AdminStats> {
    const response = await axios.get(`${this.baseURL}/admin/stats`);
    return response.data;
  }

  // Экспорт данных
  async exportUsers(format: 'csv' | 'excel'): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/admin/export/users`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  async exportOrganizations(format: 'csv' | 'excel'): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/admin/export/organizations`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  // Импорт данных
  async importUsers(file: File): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseURL}/admin/import/users`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async importOrganizations(file: File): Promise<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${this.baseURL}/admin/import/organizations`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const adminService = new AdminService();