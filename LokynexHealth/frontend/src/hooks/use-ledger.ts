import {
  getLedgerSummaryApi,
  recordLedgerEntryApi,
  syncLedgerApi,
} from "@/lib/api/ledger";
import {
  GetLedgerSummaryFilters,
  RecordLedgerEntryRequest,
  SyncLedgerRequest,
} from "@/types/ledger";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useLedgerSummary(filters: GetLedgerSummaryFilters) {
  return useQuery({
    queryKey: ["ledger-summary", filters],
    queryFn: () => getLedgerSummaryApi(filters),
  });
}

export function useSyncLedger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SyncLedgerRequest) => syncLedgerApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ledger-summary"] }),
  });
}

export function useRecordLedgerEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordLedgerEntryRequest) => recordLedgerEntryApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ledger-summary"] }),
  });
}