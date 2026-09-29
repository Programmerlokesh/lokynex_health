export interface UserDto {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  branchId: string | null;
  branchName: string | null;
  roleName: string | null;
  status: string;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ModulePermissionInput {
  moduleId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CreateUserRequest {
  name: string;
  username: string;
  email: string;
  phone: string;
  branchId?: string;
  roleId?: string;
  password: string;
  permissions: ModulePermissionInput[];
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  phone: string;
  branchId?: string;
}

export interface ToggleUserStatusRequest {
  isActive: boolean;
}

export interface ResetUserPasswordRequest {
  newPassword: string;
}

// Self-service profile — never includes password/role/branch/status.
export interface MyProfileDto {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string | null;
  pincode: string | null;
  profilePictureUrl: string | null;
  roleName: string | null;
  branchName: string | null;
}

export interface UpdateOwnProfileRequest {
  name: string;
  email: string;
  phone: string;
  address?: string;
  pincode?: string;
  profilePictureUrl?: string;
}

// LabAdmin changing their OWN password (needs the current one).
export interface ChangeOwnPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
}

export interface ModuleListItemDto {
  id: number;
  name: string;
}

export interface UserPermissionsDto {
  userId: string;
  roleId: string | null;
  permissions: {
    moduleId: number;
    moduleName: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
}

export interface UpdateUserPermissionsRequest {
  roleId?: string;
  permissions: ModulePermissionInput[];
}
