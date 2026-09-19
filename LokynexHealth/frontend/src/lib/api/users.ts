import { apiClient } from "@/lib/api-client";
import {
  CreateUserRequest,
  PagedResult,
  ToggleUserStatusRequest,
  UpdateUserRequest,
  UserDto,
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
