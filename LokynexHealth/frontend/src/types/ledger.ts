export type LedgerEntryType =
  | "Income"
  | "Expense"
  | "CommissionPayout"
  | "Refund";
export type Granularity = "day" | "week" | "month";
export type GranularityChoice = Granularity | "auto";

/* ---------- existing (kept) ---------- */
export interface LedgerSummaryDto {
  entryType: string;
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

export type UpdateLedgerEntryRequest = RecordLedgerEntryRequest;

/* ---------- analytics (charts + P&L) ---------- */
/** Outflows are POSITIVE magnitudes. net = income - refund - commissionPayout - expense */
export interface LedgerPeriodTotals {
  income: number;
  refund: number;
  commissionPayout: number;
  expense: number;
  net: number;
  entryCount: number;
}

export interface LedgerSeriesPoint {
  bucket: string; // yyyy-MM-dd (start of day / week / month)
  income: number;
  refund: number;
  commissionPayout: number;
  expense: number;
  net: number;
  cumulativeNet: number;
}

export interface LedgerBranchBreakdown {
  branchId?: string | null;
  branchName: string;
  income: number;
  outflow: number;
  net: number;
  entryCount: number;
}

export interface LedgerAnalytics {
  dateFrom: string;
  dateTo: string;
  previousFrom: string;
  previousTo: string;
  granularity: Granularity;
  current: LedgerPeriodTotals;
  previous: LedgerPeriodTotals;
  series: LedgerSeriesPoint[];
  branches: LedgerBranchBreakdown[];
}

export interface GetLedgerAnalyticsFilters {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  granularity?: GranularityChoice;
}

/* ---------- ledger table ---------- */
export type LedgerSort =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc";

export interface LedgerEntry {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  entryDate: string;
  entryType: string;
  amount: number;
  description?: string | null;
  referenceTable?: string | null;
  referenceId?: string | null;
  referenceLabel?: string | null;
  isManual: boolean;
  runningBalance?: number | null;
  createdAt: string;
}

export interface LedgerEntriesResult {
  items: LedgerEntry[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  filteredIn: number;
  filteredOut: number;
  filteredNet: number;
  hasRunningBalance: boolean;
}

export interface GetLedgerEntriesFilters {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  entryType?: string;
  search?: string;
  sort?: LedgerSort;
  pageNumber?: number;
  pageSize?: number;
}
