import { apiClient } from "@/lib/api-client";
import { RoleDto } from "@/types/user";

// LabAdmin-only — powers the Role dropdown on Create/Edit User.
export async function getRolesApi(): Promise<RoleDto[]> {
  const response = await apiClient.get<RoleDto[]>("/Roles");
  return response.data;
}
