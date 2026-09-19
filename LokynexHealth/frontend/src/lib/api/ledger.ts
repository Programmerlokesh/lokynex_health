import { apiClient } from "@/lib/api-client";
import {
  GetLedgerSummaryFilters,
  LedgerSummaryResult,
  RecordLedgerEntryRequest,
  SyncLedgerRequest,
} from "@/types/ledger";

export async function getLedgerSummaryApi(
  filters: GetLedgerSummaryFilters,
): Promise<LedgerSummaryResult> {
  const res = await apiClient.get<LedgerSummaryResult>("/Ledger/summary", {
    params: filters,
  });
  return res.data;
}

export async function syncLedgerApi(
  data: SyncLedgerRequest,
): Promise<{ synced: number }> {
  const res = await apiClient.post<{ synced: number }>("/Ledger/sync", data);
  return res.data;
}

export async function recordLedgerEntryApi(
  data: RecordLedgerEntryRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Ledger", data);
  return res.data;
}