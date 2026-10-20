import { superAdminApiClient as apiClient } from "@/lib/superadmin-api-client";
import {
  ChangeMySuperAdminPasswordRequest,
  MySuperAdminProfile,
  UpdateMySuperAdminProfileRequest,
} from "@/types/super-admin-profile";

export async function getMySuperAdminProfileApi(): Promise<MySuperAdminProfile> {
  const res = await apiClient.get<MySuperAdminProfile>("/superadmin/me");
  return res.data;
}

export async function updateMySuperAdminProfileApi(
  data: UpdateMySuperAdminProfileRequest,
): Promise<void> {
  await apiClient.put("/superadmin/me", data);
}

export async function changeMySuperAdminPasswordApi(
  data: ChangeMySuperAdminPasswordRequest,
): Promise<void> {
  await apiClient.put("/superadmin/me/password", data);
}
