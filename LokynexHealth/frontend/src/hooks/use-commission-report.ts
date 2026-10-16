import {
  getCommissionReportApi,
  getEntityOptionsApi,
  setPayoutStatusApi,
} from "@/lib/api/commission-report";
import {
  CommissionReportParams,
  PayoutEntityType,
  SetPayoutStatusRequest,
} from "@/types/commission-report";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// Key starts with "commission-payouts" so Generate / Mark Paid (which already
// invalidate that prefix) refresh this report automatically.
export function useCommissionReport(params: CommissionReportParams) {
  return useQuery({
    queryKey: ["commission-payouts", "report", params],
    queryFn: () => getCommissionReportApi(params),
    placeholderData: keepPreviousData,
  });
}

export function useSetPayoutStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetPayoutStatusRequest) => setPayoutStatusApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commission-payouts"] }),
  });
}

export function useEntityOptions(type: PayoutEntityType, search: string) {
  return useQuery({
    queryKey: ["commission-entity-options", type, search],
    queryFn: () => getEntityOptionsApi(type, search || undefined),
    staleTime: 60_000,
  });
}
