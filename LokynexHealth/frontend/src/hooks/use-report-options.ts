import {
  createReportOptionApi,
  deleteReportOptionApi,
  getReportOptionsApi,
} from "@/lib/api/report-options";
import { ReportOptionKind } from "@/types/report-option";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useReportOptions(kind: ReportOptionKind) {
  return useQuery({
    queryKey: ["report-options", kind],
    queryFn: () => getReportOptionsApi(kind),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateReportOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReportOptionApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-options"] }),
  });
}

export function useDeleteReportOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReportOptionApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-options"] }),
  });
}
