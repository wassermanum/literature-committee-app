import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Organization,
  CreateUserRequest,
  UpdateUserRequest,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  UserFilters,
  OrganizationFilters,
  SystemSettings,
  UpdateSystemSettingRequest,
  RolePermission,
  UpdateRolePermissionRequest,
  AdminStats,
} from '@/types';
import { adminService } from '@/services';

export const useUsers = (
  initialPage = 1,
  initialLimit = 20,
  initialFilters?: UserFilters
) => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [filters, setFilters] = useState<UserFilters | undefined>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUsers(page, limit, filters);
      setUsers(response.users);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const createUser = async (data: CreateUserRequest): Promise<User> => {
    try {
      setError(null);
      const newUser = await adminService.createUser(data);
      await fetchUsers(); // Обновляем список
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания пользователя';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUser = async (id: string, data: UpdateUserRequest): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await adminService.updateUser(id, data);
      await fetchUsers(); // Обновляем список
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления пользователя';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      setError(null);
      await adminService.deleteUser(id);
      await fetchUsers(); // Обновляем список
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления пользователя';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (id: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      await adminService.resetUserPassword(id, newPassword);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сброса пароля';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateFilters = (newFilters: UserFilters) => {
    setFilters(newFilters);
    setPage(1); // Сбрасываем на первую страницу
  };

  const updatePage = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    total,
    page,
    limit,
    filters,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    updateFilters,
    updatePage,
    refetch: fetchUsers,
  };
};

export const useOrganizations = (
  initialPage = 1,
  initialLimit = 20,
  initialFilters?: OrganizationFilters
) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [filters, setFilters] = useState<OrganizationFilters | undefined>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getOrganizations(page, limit, filters);
      setOrganizations(response.organizations);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки организаций');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const createOrganization = async (data: CreateOrganizationRequest): Promise<Organization> => {
    try {
      setError(null);
      const newOrg = await adminService.createOrganization(data);
      await fetchOrganizations(); // Обновляем список
      return newOrg;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания организации';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateOrganization = async (
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<Organization> => {
    try {
      setError(null);
      const updatedOrg = await adminService.updateOrganization(id, data);
      await fetchOrganizations(); // Обновляем список
      return updatedOrg;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления организации';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteOrganization = async (id: string): Promise<void> => {
    try {
      setError(null);
      await adminService.deleteOrganization(id);
      await fetchOrganizations(); // Обновляем список
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления организации';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateFilters = (newFilters: OrganizationFilters) => {
    setFilters(newFilters);
    setPage(1); // Сбрасываем на первую страницу
  };

  const updatePage = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    total,
    page,
    limit,
    filters,
    loading,
    error,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    updateFilters,
    updatePage,
    refetch: fetchOrganizations,
  };
};

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getSystemSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки настроек');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = async (key: string, data: UpdateSystemSettingRequest): Promise<void> => {
    try {
      setError(null);
      await adminService.updateSystemSetting(key, data);
      await fetchSettings(); // Обновляем список
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления настройки';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    refetch: fetchSettings,
  };
};

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getAdminStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};

export const useRolePermissions = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getRolePermissions();
      setPermissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки прав доступа');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePermission = async (
    id: string,
    data: UpdateRolePermissionRequest
  ): Promise<void> => {
    try {
      setError(null);
      await adminService.updateRolePermission(id, data);
      await fetchPermissions(); // Обновляем список
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления прав доступа';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    updatePermission,
    refetch: fetchPermissions,
  };
};