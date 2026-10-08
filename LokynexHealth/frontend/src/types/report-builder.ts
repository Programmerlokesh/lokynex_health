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
  orderId: string;
  orderItemId: string;
  orderNumber: string;
  testName: string;
  departmentName: string;
  patientName: string;
  headerContent: string | null;
  footerContent: string | null;
  bodyContent: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface GenerateReportDocumentRequest {
  orderItemId: string;
  templateId: string;
}

export interface CreateReportDocumentRequest {
  orderItemId: string;
  headerContent?: string;
  bodyContent?: string;
  footerContent?: string;
  sourceType?: "Manual" | "UploadedDocument";
}

export interface UpdateReportDocumentRequest {
  headerContent?: string;
  footerContent?: string;
  bodyContent?: string;
}

export interface GetReportDocumentsParams {
  orderItemId?: string;
  orderId?: string;
  showDeleted?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface OrderForReportItemDto {
  id: string;
  testName: string;
  departmentName: string;
  reportCount: number;
}

export interface OrderForReportDto {
  id: string;
  orderNumber: string;
  patientName: string;
  patientPhone: string;
  patientAge: number | null;
  patientGender: string | null;
  patientAddress: string | null;
  doctorName: string | null;
  referralName: string | null;
  branchName: string | null;
  branchAddress: string | null;
  branchPhone: string | null;
  createdAt: string;
  items: OrderForReportItemDto[];
}

export interface GetOrdersForReportParams {
  search?: string;
  onlyPending?: boolean;
  pageNumber?: number;
  pageSize?: number;
}