import { apiClient } from "@/lib/api-client";
import {
  BloodReportFormDto,
  LabReportSettingsDto,
  LogDeliveryRequest,
  SaveBloodReportRequest,
  SaveBloodReportResult,
} from "@/types/blood-report";

export async function getBloodReportFormApi(
  orderItemId: string,
): Promise<BloodReportFormDto> {
  const res = await apiClient.get<BloodReportFormDto>(
    `/BloodReports/form/${orderItemId}`,
  );
  return res.data;
}

export async function saveBloodReportApi(
  data: SaveBloodReportRequest,
): Promise<SaveBloodReportResult> {
  const res = await apiClient.post<SaveBloodReportResult>(
    "/BloodReports/save",
    data,
  );
  return res.data;
}

export async function getLabReportSettingsApi(
  departmentId?: string | null,
): Promise<LabReportSettingsDto> {
  const res = await apiClient.get<LabReportSettingsDto>(
    "/BloodReports/settings",
    { params: departmentId ? { departmentId } : undefined },
  );
  return res.data;
}

/** Ids of the departments that have their own report pad. */
export async function getCustomPadDepartmentsApi(): Promise<string[]> {
  const res = await apiClient.get<string[]>(
    "/BloodReports/settings/departments",
  );
  return res.data;
}

/** Remove a department's own pad (it goes back to the lab default). */
export async function deleteDepartmentPadApi(
  departmentId: string,
): Promise<void> {
  await apiClient.delete(`/BloodReports/settings/${departmentId}`);
}

export async function saveLabReportSettingsApi(
  data: LabReportSettingsDto,
): Promise<void> {
  await apiClient.put("/BloodReports/settings", data);
}

export async function logReportDeliveryApi(
  data: LogDeliveryRequest,
): Promise<void> {
  const { documentId, ...body } = data;
  await apiClient.post(`/BloodReports/${documentId}/delivery`, body);
}
