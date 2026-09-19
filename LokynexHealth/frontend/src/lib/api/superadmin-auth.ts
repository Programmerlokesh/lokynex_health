import { superAdminApiClient } from "@/lib/superadmin-api-client";
import {
  SuperAdminLoginRequest,
  SuperAdminLoginResponse,
} from "@/types/superadmin-auth";

export async function superAdminLoginApi(
  data: SuperAdminLoginRequest,
): Promise<SuperAdminLoginResponse> {
  const res = await superAdminApiClient.post<SuperAdminLoginResponse>(
    "/Auth/superadmin-login",
    data,
  );
  return res.data;
}
