import {
  deleteDepartmentPadApi,
  getBloodReportFormApi,
  getCustomPadDepartmentsApi,
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

/** Header / footer / blank space / signature (the "Report Pad") of the lab default or one department. */
export function useLabReportSettings(departmentId?: string | null) {
  return useQuery({
    queryKey: ["lab-report-settings", departmentId ?? "default"],
    queryFn: () => getLabReportSettingsApi(departmentId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

/** Departments that already have their own pad. */
export function useCustomPadDepartments() {
  return useQuery({
    queryKey: ["lab-report-settings-departments"],
    queryFn: getCustomPadDepartmentsApi,
    refetchOnWindowFocus: false,
  });
}

export function useSaveLabReportSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LabReportSettingsDto) => saveLabReportSettingsApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab-report-settings"] });
      qc.invalidateQueries({ queryKey: ["lab-report-settings-departments"] });
      qc.invalidateQueries({ queryKey: ["blood-report-form"] });
    },
  });
}

export function useDeleteDepartmentPad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => deleteDepartmentPadApi(departmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab-report-settings"] });
      qc.invalidateQueries({ queryKey: ["lab-report-settings-departments"] });
      qc.invalidateQueries({ queryKey: ["blood-report-form"] });
    },
  });
}

export function useLogReportDelivery() {
  return useMutation({
    mutationFn: (data: LogDeliveryRequest) => logReportDeliveryApi(data),
  });
}
