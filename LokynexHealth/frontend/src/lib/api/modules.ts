import { apiClient } from "@/lib/api-client";
import { ModuleListItemDto } from "@/types/user";

// LabAdmin-only — powers the permission grid on Create/Edit User.
export async function getModulesApi(): Promise<ModuleListItemDto[]> {
  const response = await apiClient.get<ModuleListItemDto[]>("/Modules");
  return response.data;
}
