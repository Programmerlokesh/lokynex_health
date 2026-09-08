import { apiClient } from "@/lib/api-client";
import { BranchDto, UpdateBranchRequest } from "@/types/branch";
import { PagedResult } from "@/types/user";

export async function getBranchesApi(params: {
  search?: string;
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<BranchDto>> {
  const response = await apiClient.get<PagedResult<BranchDto>>("/Branches", {
    params,
  });
  return response.data;
}

export async function updateBranchApi(
  id: string,
  data: UpdateBranchRequest,
): Promise<void> {
  await apiClient.put(`/Branches/${id}`, data);
}
