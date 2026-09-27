import { apiClient } from "@/lib/api-client";
import {
  CreateUserRequest,
  MyProfileDto,
  PagedResult,
  ResetUserPasswordRequest,
  ToggleUserStatusRequest,
  UpdateOwnProfileRequest,
  UpdateUserPermissionsRequest,
  UpdateUserRequest,
  UserDto,
  UserPermissionsDto,
} from "@/types/user";

export async function getUsersApi(params: {
  search?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<UserDto>> {
  const response = await apiClient.get<PagedResult<UserDto>>("/Users", {
    params,
  });
  return response.data;
}

export async function createUserApi(
  data: CreateUserRequest,
): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>("/Users", data);
  return response.data;
}

export async function updateUserApi(
  id: string,
  data: UpdateUserRequest,
): Promise<void> {
  await apiClient.put(`/Users/${id}`, data);
}

export async function toggleUserStatusApi(
  id: string,
  data: ToggleUserStatusRequest,
): Promise<void> {
  await apiClient.patch(`/Users/${id}/status`, data);
}

export async function deleteUserApi(id: string): Promise<void> {
  await apiClient.delete(`/Users/${id}`);
}

// LabAdmin-only — the only way a lab user's password ever changes.
export async function resetUserPasswordApi(
  id: string,
  data: ResetUserPasswordRequest,
): Promise<void> {
  await apiClient.post(`/Users/${id}/reset-password`, data);
}

// LabAdmin-only — fetch a user's current role + full module permission grid,
// used to pre-fill the Edit User dialog.
export async function getUserPermissionsApi(
  id: string,
): Promise<UserPermissionsDto> {
  const response = await apiClient.get<UserPermissionsDto>(
    `/Users/${id}/permissions`,
  );
  return response.data;
}

// LabAdmin-only — replaces a user's role + entire permission grid.
export async function updateUserPermissionsApi(
  id: string,
  data: UpdateUserPermissionsRequest,
): Promise<void> {
  await apiClient.put(`/Users/${id}/permissions`, data);
}

// Self-service — the logged-in user's own profile.
export async function getMyProfileApi(): Promise<MyProfileDto> {
  const response = await apiClient.get<MyProfileDto>("/Users/me");
  return response.data;
}

// Self-service — never includes password. See UpdateOwnProfileRequest.
export async function updateMyProfileApi(
  data: UpdateOwnProfileRequest,
): Promise<void> {
  await apiClient.put("/Users/me", data);
}
