export interface ReportTemplateDto {
  id: string;
  name: string;
  sourceType: string; // "Manual" | "UploadedDocument"
  isDeleted: boolean;
  createdAt: string;
}

export interface CreateReportTemplateRequest {
  name: string;
  departmentId?: string;
  headerContent?: string;
  footerContent?: string;
  bodyContent?: string;
  sourceType: string;
}

export interface OrderItemLookupDto {
  id: string;
  orderNumber: string;
  testName: string;
  patientName: string;
  patientPhone: string;
}

export interface ReportDocumentDto {
  id: string;
  orderItemId: string;
  orderNumber: string;
  testName: string;
  patientName: string;
  headerContent: string | null;
  footerContent: string | null;
  bodyContent: string | null;
  isDeleted: boolean;
  createdAt: string;
}

export interface GenerateReportDocumentRequest {
  orderItemId: string;
  templateId: string;
}

export interface UpdateReportDocumentRequest {
  headerContent?: string;
  footerContent?: string;
  bodyContent?: string;
}

export interface GetReportDocumentsParams {
  orderItemId?: string;
  showDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}
