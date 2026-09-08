import { apiClient } from "@/lib/api-client";
import { LoginRequest, LoginResponse } from "@/types/auth";

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/Auth/login", data);
  return response.data;
}
