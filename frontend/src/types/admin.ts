import { User, UserRole } from './auth';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  parentId?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Organization[];
  parent?: Organization;
}

export enum OrganizationType {
  GROUP = 'group',
  LOCAL_SUBCOMMITTEE = 'local_subcommittee',
  LOCALITY = 'locality',
  REGION = 'region',
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
}

export interface CreateOrganizationRequest {
  name: string;
  type: OrganizationType;
  parentId?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  type?: OrganizationType;
  parentId?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
}

export interface OrganizationFilters {
  search?: string;
  type?: OrganizationType;
  parentId?: string;
  isActive?: boolean;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  isEditable: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateSystemSettingRequest {
  value: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  resource: string;
  action: string;
  allowed: boolean;
}

export interface UpdateRolePermissionRequest {
  allowed: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalOrganizations: number;
  activeOrganizations: number;
  usersByRole: Record<UserRole, number>;
  organizationsByType: Record<OrganizationType, number>;
  recentActivity: {
    date: string;
    action: string;
    user: string;
    target: string;
  }[];
}