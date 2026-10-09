import { apiClient } from "@/lib/api-client";
import {
  CreateReportDocumentRequest,
  CreateReportTemplateRequest,
  GenerateReportDocumentRequest,
  GetOrdersForReportParams,
  GetReportDocumentsParams,
  OrderForReportDto,
  OrderItemLookupDto,
  OrdersForReportResult,
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

export async function getOrdersForReportApi(
  params: GetOrdersForReportParams,
): Promise<OrdersForReportResult> {
  // drop empty values so the URL stays clean
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined),
  );
  const res = await apiClient.get<OrdersForReportResult>(
    "/ReportDocuments/orders",
    { params: clean },
  );
  return res.data;
}

export async function getOrderForReportApi(
  orderId: string,
): Promise<OrderForReportDto> {
  const res = await apiClient.get<OrderForReportDto>(
    `/ReportDocuments/orders/${orderId}`,
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

export async function getReportDocumentApi(
  id: string,
): Promise<ReportDocumentDto> {
  const res = await apiClient.get<ReportDocumentDto>(`/ReportDocuments/${id}`);
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

export async function createReportDocumentApi(
  data: CreateReportDocumentRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/ReportDocuments", data);
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

// Legacy .doc -> .docx (server converts with LibreOffice). Returns the .docx bytes.
export async function convertDocToDocxApi(file: File): Promise<ArrayBuffer> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<ArrayBuffer>(
    "/ReportDocuments/convert-doc",
    form,
    {
      responseType: "arraybuffer",
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 90_000,
    },
  );
  return res.data;
}
