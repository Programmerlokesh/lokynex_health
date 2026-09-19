import {
  generatePayoutsApi,
  getPayoutsApi,
  markPayoutsPaidApi,
} from "@/lib/api/commission-payouts";
import {
  GeneratePayoutsRequest,
  GetPayoutsFilters,
  MarkPayoutsPaidRequest,
} from "@/types/commission-payout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePayouts(filters: GetPayoutsFilters) {
  return useQuery({
    queryKey: ["commission-payouts", filters],
    queryFn: () => getPayoutsApi(filters),
  });
}

export function useGeneratePayouts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GeneratePayoutsRequest) => generatePayoutsApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-payouts"] }),
  });
}

export function useMarkPayoutsPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MarkPayoutsPaidRequest) => markPayoutsPaidApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-payouts"] }),
  });
}
