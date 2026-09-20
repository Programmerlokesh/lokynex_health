import { apiClient } from "@/lib/api-client";
import {
  LoginRequest,
  LoginResponse,
  UnifiedLoginResponse,
} from "@/types/auth";

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/Auth/login", data);
  return response.data;
}

// One endpoint for both lab users and the platform SuperAdmin.
export async function unifiedLoginApi(
  data: LoginRequest,
): Promise<UnifiedLoginResponse> {
  const response = await apiClient.post<UnifiedLoginResponse>(
    "/Auth/sign-in",
    data,
  );
  return response.data;
}
