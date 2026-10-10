export type ResultFlag = "Normal" | "Low" | "High" | "Critical" | "Abnormal";

export interface BloodParameterDto {
  parameterId: string;
  sectionName: string;
  name: string;
  unit: string | null;
  referenceText: string | null;
  low: number | null;
  high: number | null;
  criticalLow: number | null;
  criticalHigh: number | null;
  resultType: string; // "Auto" | "Numeric" | "Text"
  decimalPlaces: number | null;
  isBold: boolean;
  sortOrder: number;
  resultValue: string | null;
  flag: ResultFlag;
}

export interface LabReportSettingsDto {
  useLetterhead: boolean;
  headerHtml: string | null;
  footerHtml: string | null;
  headerSpaceMm: number;
  footerSpaceMm: number;
  pathologistName: string | null;
  pathologistQualification: string | null;
  registrationNo: string | null;
  signatureImage: string | null;
}

export interface BloodReportFormDto {
  orderId: string;
  orderItemId: string;
  orderNumber: string;
  orderCreatedAt: string;
  testName: string;
  departmentName: string;

  patientName: string;
  patientCode: string | null;
  patientPhone: string;
  whatsappNumber: string | null;
  patientAge: number | null;
  patientGender: string | null;
  doctorName: string | null;
  referralName: string | null;
  branchName: string | null;
  branchAddress: string | null;
  branchPhone: string | null;

  reportDocumentId: string | null;
  hasFormat: boolean;

  sampleId: string | null;
  specimen: string | null;
  method: string | null;
  machineName: string | null;
  reagentName: string | null;
  remarks: string | null;
  sampleCollectedAt: string | null;
  reportedAt: string | null;

  parameters: BloodParameterDto[];
  settings: LabReportSettingsDto;
}

export interface SaveBloodReportRequest {
  orderItemId: string;
  sampleId?: string;
  specimen?: string;
  method?: string;
  machineName?: string;
  reagentName?: string;
  remarks?: string;
  sampleCollectedAt?: string | null;
  reportedAt?: string | null;
  rememberDefaults: boolean;
  useLetterhead: boolean;
  headerContent: string;
  bodyContent: string;
  footerContent: string;
  results: { parameterId: string; value: string; flag: ResultFlag }[];
}

export type DeliveryChannel = "Print" | "Download" | "WhatsApp";

export interface LogDeliveryRequest {
  documentId: string;
  channel: DeliveryChannel;
  sentTo?: string;
  status?: "Queued" | "Done" | "Failed";
  errorMessage?: string;
}
