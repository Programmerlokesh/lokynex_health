export interface UserDto {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
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
