import { apiClient } from "@/lib/api-client";
import {
  BulkSetCommissionRequest,
  CommissionOverrideDto,
  EffectiveCommissionDto,
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

export async function getEffectiveCommissionsApi(params: {
  entityType: string;
  entityId: string;
  departmentId: string;
}): Promise<EffectiveCommissionDto[]> {
  const res = await apiClient.get<EffectiveCommissionDto[]>(
    "/CommissionOverrides/effective",
    { params },
  );
  return res.data;
}

export async function bulkSetCommissionsApi(
  data: BulkSetCommissionRequest,
): Promise<{ changed: number }> {
  const res = await apiClient.put<{ changed: number }>(
    "/CommissionOverrides/bulk",
    data,
  );
  return res.data;
}
