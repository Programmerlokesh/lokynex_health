import { apiClient } from "@/lib/api-client";
import {
  CommissionOverrideDto,
  SetCommissionOverrideRequest,
} from "@/types/commission";
import { PagedResult } from "@/types/user";

export async function getCommissionOverridesApi(params: {
  entityType?: string;
  entityId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<CommissionOverrideDto>> {
  const res = await apiClient.get<PagedResult<CommissionOverrideDto>>(
    "/CommissionOverrides",
    { params },
  );
  return res.data;
}

export async function setCommissionOverrideApi(
  data: SetCommissionOverrideRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>(
    "/CommissionOverrides",
    data,
  );
  return res.data;
}
