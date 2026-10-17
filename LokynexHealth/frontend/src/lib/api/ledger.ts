import { apiClient } from "@/lib/api-client";
import {
  GetLedgerAnalyticsFilters,
  GetLedgerEntriesFilters,
  GetLedgerSummaryFilters,
  LedgerAnalytics,
  LedgerEntriesResult,
  LedgerSummaryResult,
  RecordLedgerEntryRequest,
  SyncLedgerRequest,
  UpdateLedgerEntryRequest,
} from "@/types/ledger";

export async function getLedgerSummaryApi(
  filters: GetLedgerSummaryFilters,
): Promise<LedgerSummaryResult> {
  const res = await apiClient.get<LedgerSummaryResult>("/Ledger/summary", {
    params: filters,
  });
  return res.data;
}

export async function getLedgerAnalyticsApi(
  filters: GetLedgerAnalyticsFilters,
): Promise<LedgerAnalytics> {
  const res = await apiClient.get<LedgerAnalytics>("/Ledger/analytics", {
    params: filters,
  });
  return res.data;
}

export async function getLedgerEntriesApi(
  filters: GetLedgerEntriesFilters,
): Promise<LedgerEntriesResult> {
  const res = await apiClient.get<LedgerEntriesResult>("/Ledger/entries", {
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

export async function updateLedgerEntryApi(
  id: string,
  data: UpdateLedgerEntryRequest,
): Promise<void> {
  await apiClient.put(`/Ledger/${id}`, data);
}

export async function deleteLedgerEntryApi(id: string): Promise<void> {
  await apiClient.delete(`/Ledger/${id}`);
}
