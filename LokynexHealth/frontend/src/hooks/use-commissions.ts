import {
  getCommissionOverridesApi,
  setCommissionOverrideApi,
} from "@/lib/api/commissions";
import { SetCommissionOverrideRequest } from "@/types/commission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCommissionOverrides(entityType: string) {
  return useQuery({
    queryKey: ["commission-overrides", entityType],
    queryFn: () =>
      getCommissionOverridesApi({
        entityType: entityType || undefined,
        pageSize: 50,
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
