export interface PayoutDto {
  id: string;
  entityType: string; // "Doctor" | "Referral" | "Technician"
  entityId: string;
  entityName: string;
  orderItemId: string;
  commissionAmount: number;
  status: string; // "Paid" | "Unpaid"
  generatedAt: string;
  paidAt: string | null;
}

export interface PayoutSummaryDto {
  periodLabel: string;
  count: number;
  totalAmount: number;
}

export interface GetPayoutsResult {
  items: PayoutDto[];
  summary: PayoutSummaryDto[];
  grandTotal: number;
}

export interface GetPayoutsFilters {
  dateFrom?: string;
  dateTo?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  groupBy: "Day" | "Week" | "Month";
}

export interface GeneratePayoutsRequest {
  dateFrom: string;
  dateTo: string;
  branchId?: string;
}

export interface MarkPayoutsPaidRequest {
  payoutIds: string[];
}
