import {
  bulkSetCommissionsApi,
  getCommissionOverridesApi,
  getEffectiveCommissionsApi,
  setCommissionOverrideApi,
} from "@/lib/api/commissions";
import {
  BulkSetCommissionRequest,
  SetCommissionOverrideRequest,
} from "@/types/commission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCommissionOverrides(entityType: string) {
  return useQuery({
    queryKey: ["commission-overrides", entityType],
    queryFn: () =>
      getCommissionOverridesApi({
        entityType: entityType || undefined,
        pageSize: 200,
      }),
  });
}

export function useSetCommissionOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetCommissionOverrideRequest) =>
      setCommissionOverrideApi(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["commission-overrides"] }),
  });
}

export function useEffectiveCommissions(params: {
  entityType: string;
  entityId: string | null;
  departmentId: string | null;
}) {
  return useQuery({
    queryKey: [
      "effective-commissions",
      params.entityType,
      params.entityId,
      params.departmentId,
    ],
    queryFn: () =>
      getEffectiveCommissionsApi({
        entityType: params.entityType,
        entityId: params.entityId as string,
        departmentId: params.departmentId as string,
      }),
    enabled: !!params.entityId && !!params.departmentId,
    staleTime: 0,
  });
}

export function useBulkSetCommissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSetCommissionRequest) => bulkSetCommissionsApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["effective-commissions"] });
      qc.invalidateQueries({ queryKey: ["commission-overrides"] });
      qc.invalidateQueries({ queryKey: ["test-commissions"] });
    },
  });
}

/** Every custom commission one person has (used to show the right amount on a new order). */
export function useEntityOverrides(
  entityType: string,
  entityId: string | null,
) {
  return useQuery({
    queryKey: ["commission-overrides", "entity", entityType, entityId],
    queryFn: () =>
      getCommissionOverridesApi({
        entityType,
        entityId: entityId as string,
        pageSize: 500,
      }),
    enabled: !!entityId,
  });
}
