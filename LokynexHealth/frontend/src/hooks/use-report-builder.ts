import {
  createReportDocumentApi,
  createReportTemplateApi,
  deleteReportDocumentApi,
  deleteReportTemplateApi,
  generateReportDocumentApi,
  getOrderForReportApi,
  getOrderItemsLookupApi,
  getOrdersForReportApi,
  getReportDocumentApi,
  getReportDocumentsApi,
  getReportTemplatesApi,
  updateReportDocumentApi,
} from "@/lib/api/report-builder";
import {
  CreateReportDocumentRequest,
  CreateReportTemplateRequest,
  GenerateReportDocumentRequest,
  GetOrdersForReportParams,
  GetReportDocumentsParams,
  UpdateReportDocumentRequest,
} from "@/types/report-builder";
import {
  keepPreviousData,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/** Documents changed -> every list that shows report counts / status must refetch. */
function invalidateReports(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["report-documents"] });
  qc.invalidateQueries({ queryKey: ["report-orders"] });
}

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
    staleTime: 0, // BUG FIX: new orders must show up immediately
    refetchOnMount: "always",
  });
}

/** Order-wise list for the Upload Report page. Always fresh. */
export function useOrdersForReport(params: GetOrdersForReportParams) {
  return useQuery({
    queryKey: ["report-orders", "list", params],
    queryFn: () => getOrdersForReportApi(params),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useOrderForReport(orderId: string | null) {
  return useQuery({
    queryKey: ["report-orders", "detail", orderId],
    queryFn: () => getOrderForReportApi(orderId!),
    enabled: !!orderId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useReportDocuments(params: GetReportDocumentsParams) {
  return useQuery({
    queryKey: ["report-documents", params],
    queryFn: () => getReportDocumentsApi(params),
  });
}

export function useReportDocument(id: string | null) {
  return useQuery({
    queryKey: ["report-documents", "detail", id],
    queryFn: () => getReportDocumentApi(id!),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useGenerateReportDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateReportDocumentRequest) =>
      generateReportDocumentApi(data),
    onSuccess: () => invalidateReports(qc),
  });
}

export function useCreateReportDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportDocumentRequest) =>
      createReportDocumentApi(data),
    onSuccess: () => invalidateReports(qc),
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
    onSuccess: () => invalidateReports(qc),
  });
}

export function useDeleteReportDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReportDocumentApi(id),
    onSuccess: () => invalidateReports(qc),
  });
}
