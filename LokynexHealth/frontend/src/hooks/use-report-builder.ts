import {
  createReportTemplateApi,
  deleteReportDocumentApi,
  deleteReportTemplateApi,
  generateReportDocumentApi,
  getOrderItemsLookupApi,
  getReportDocumentsApi,
  getReportTemplatesApi,
  updateReportDocumentApi,
} from "@/lib/api/report-builder";
import {
  CreateReportTemplateRequest,
  GenerateReportDocumentRequest,
  GetReportDocumentsParams,
  UpdateReportDocumentRequest,
} from "@/types/report-builder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useReportTemplates(showDeleted: boolean) {
  return useQuery({
    queryKey: ["report-templates", showDeleted],
    queryFn: () => getReportTemplatesApi({ showDeleted, pageSize: 50 }),
  });
}

export function useCreateReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportTemplateRequest) =>
      createReportTemplateApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-templates"] }),
  });
}

export function useDeleteReportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReportTemplateApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-templates"] }),
  });
}

export function useOrderItemsLookup(search: string) {
  return useQuery({
    queryKey: ["order-items-lookup", search],
    queryFn: () => getOrderItemsLookupApi(search),
  });
}

export function useReportDocuments(params: GetReportDocumentsParams) {
  return useQuery({
    queryKey: ["report-documents", params],
    queryFn: () => getReportDocumentsApi(params),
  });
}

export function useGenerateReportDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateReportDocumentRequest) =>
      generateReportDocumentApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-documents"] }),
  });
}

export function useUpdateReportDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReportDocumentRequest;
    }) => updateReportDocumentApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-documents"] }),
  });
}

export function useDeleteReportDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReportDocumentApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-documents"] }),
  });
}
