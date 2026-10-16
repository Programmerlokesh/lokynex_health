export type PayoutEntityType = "Doctor" | "Referral" | "Technician";
export type PayoutStatusValue = "Paid" | "Unpaid";
export type StatusFilter = "All" | PayoutStatusValue;
export type WiseMode = "Day" | "Week" | "Month";

export interface CommissionReportRow {
  payoutId: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  patientName: string;
  patientPhone: string;
  testName: string;
  testAmount: number;
  less: number;
  paid: number;
  due: number;
  doctorName: string | null;
  referralName: string | null;
  entityId: string;
  entityName: string;
  commissionAmount: number;
  status: string; // "Paid" | "Unpaid"
  paidAt: string | null;
}

export interface CommissionReportSummary {
  orderCount: number;
  testCount: number;
  lineTotal: number;
  totalLess: number;
  totalPaid: number;
  totalDue: number;
  commission: number;
  paidCommission: number;
  unpaidCommission: number;
}

export interface CommissionReportResult {
  rows: CommissionReportRow[];
  summary: CommissionReportSummary;
  truncated: boolean;
  maxRows: number;
}

/** Query-string of GET /CommissionPayouts/report. */
export interface CommissionReportParams {
  dateFrom?: string;
  dateTo?: string;
  tzOffsetMinutes?: number;
  entityType: PayoutEntityType;
  entityId?: string;
  status?: StatusFilter;
  phone?: string;
  email?: string;
  address?: string;
}

export interface SetPayoutStatusRequest {
  payoutIds: string[];
  status: PayoutStatusValue;
}

/** Doctor / referral / technician as shown in the "who" dropdown. */
export interface EntityOption {
  id: string;
  fullName: string;
  phone: string;
}
