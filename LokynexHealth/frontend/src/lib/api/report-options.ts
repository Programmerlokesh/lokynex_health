import { apiClient } from "@/lib/api-client";
import { ReportOptionDto, ReportOptionKind } from "@/types/report-option";

export async function getReportOptionsApi(
  kind?: ReportOptionKind,
): Promise<ReportOptionDto[]> {
  const res = await apiClient.get<ReportOptionDto[]>("/ReportOptions", {
    params: { kind },
  });
  return res.data;
}

export async function createReportOptionApi(data: {
  kind: ReportOptionKind;
  name: string;
}): Promise<ReportOptionDto> {
  const res = await apiClient.post<ReportOptionDto>("/ReportOptions", data);
  return res.data;
}

export async function deleteReportOptionApi(id: string): Promise<void> {
  await apiClient.delete(`/ReportOptions/${id}`);
}
