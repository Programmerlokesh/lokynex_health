import {
  getBloodReportFormApi,
  logReportDeliveryApi,
  saveBloodReportApi,
  saveLabReportSettingsApi,
} from "@/lib/api/blood-reports";
import {
  LabReportSettingsDto,
  LogDeliveryRequest,
  SaveBloodReportRequest,
} from "@/types/blood-report";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useBloodReportForm(orderItemId: string | undefined) {
  return useQuery({
    queryKey: ["blood-report-form", orderItemId],
    queryFn: () => getBloodReportFormApi(orderItemId as string),
    enabled: !!orderItemId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useSaveBloodReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveBloodReportRequest) => saveBloodReportApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blood-report-form"] });
      qc.invalidateQueries({ queryKey: ["report-documents"] });
      qc.invalidateQueries({ queryKey: ["report-orders"] });
    },
  });
}

export function useSaveLabReportSettings() {
  return useMutation({
    mutationFn: (data: LabReportSettingsDto) => saveLabReportSettingsApi(data),
  });
}

export function useLogReportDelivery() {
  return useMutation({
    mutationFn: (data: LogDeliveryRequest) => logReportDeliveryApi(data),
  });
}
