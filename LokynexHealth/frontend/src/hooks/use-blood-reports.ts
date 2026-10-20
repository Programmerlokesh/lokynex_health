import {
  getBloodReportFormApi,
  getLabReportSettingsApi,
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
      qc.invalidateQueries({ queryKey: ["report-options"] });
    },
  });
}

/** Lab header / footer / blank space / signature (the "Report Pad"). */
export function useLabReportSettings() {
  return useQuery({
    queryKey: ["lab-report-settings"],
    queryFn: getLabReportSettingsApi,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useSaveLabReportSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LabReportSettingsDto) => saveLabReportSettingsApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab-report-settings"] });
      qc.invalidateQueries({ queryKey: ["blood-report-form"] });
    },
  });
}

export function useLogReportDelivery() {
  return useMutation({
    mutationFn: (data: LogDeliveryRequest) => logReportDeliveryApi(data),
  });
}
