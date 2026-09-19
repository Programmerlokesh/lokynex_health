import { apiClient } from "@/lib/api-client";
import {
  CreateReportTemplateRequest,
  GenerateReportDocumentRequest,
  GetReportDocumentsParams,
  OrderItemLookupDto,
  ReportDocumentDto,
  ReportTemplateDto,
  UpdateReportDocumentRequest,
} from "@/types/report-builder";
import { PagedResult } from "@/types/user";

export async function getReportTemplatesApi(params: {
  showDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<ReportTemplateDto>> {
  const res = await apiClient.get<PagedResult<ReportTemplateDto>>(
    "/ReportTemplates",
    { params },
  );
  return res.data;
}

export async function createReportTemplateApi(
  data: CreateReportTemplateRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/ReportTemplates", data);
  return res.data;
}

export async function deleteReportTemplateApi(id: string): Promise<void> {
  await apiClient.delete(`/ReportTemplates/${id}`);
}

export async function getOrderItemsLookupApi(
  search: string,
): Promise<OrderItemLookupDto[]> {
  const res = await apiClient.get<OrderItemLookupDto[]>(
    "/ReportDocuments/order-items-lookup",
    { params: { search: search || undefined } },
  );
  return res.data;
}

export async function getReportDocumentsApi(
  params: GetReportDocumentsParams,
): Promise<PagedResult<ReportDocumentDto>> {
  const res = await apiClient.get<PagedResult<ReportDocumentDto>>(
    "/ReportDocuments",
    { params },
  );
  return res.data;
}

export async function generateReportDocumentApi(
  data: GenerateReportDocumentRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>(
    "/ReportDocuments/generate",
    data,
  );
  return res.data;
}

export async function updateReportDocumentApi(
  id: string,
  data: UpdateReportDocumentRequest,
): Promise<void> {
  await apiClient.put(`/ReportDocuments/${id}`, data);
}

export async function deleteReportDocumentApi(id: string): Promise<void> {
  await apiClient.delete(`/ReportDocuments/${id}`);
}
