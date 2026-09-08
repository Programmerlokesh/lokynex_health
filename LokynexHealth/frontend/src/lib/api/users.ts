import { apiClient } from "@/lib/api-client";
import { CreateUserRequest, PagedResult, UserDto } from "@/types/user";

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
