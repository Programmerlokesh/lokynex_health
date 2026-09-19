export interface LedgerSummaryDto {
  entryType: string; // "Income" | "Expense" | "CommissionPayout" | "Refund"
  totalAmount: number;
  entryCount: number;
}

export interface LedgerSummaryResult {
  byType: LedgerSummaryDto[];
  netProfitLoss: number;
}

export interface GetLedgerSummaryFilters {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SyncLedgerRequest {
  dateFrom: string;
  dateTo: string;
}

export interface RecordLedgerEntryRequest {
  branchId?: string;
  entryDate: string;
  entryType: string;
  amount: number;
  description?: string;
}