import {
  deleteLedgerEntryApi,
  getLedgerAnalyticsApi,
  getLedgerEntriesApi,
  getLedgerSummaryApi,
  recordLedgerEntryApi,
  syncLedgerApi,
  updateLedgerEntryApi,
} from "@/lib/api/ledger";
import {
  GetLedgerAnalyticsFilters,
  GetLedgerEntriesFilters,
  GetLedgerSummaryFilters,
  RecordLedgerEntryRequest,
  SyncLedgerRequest,
  UpdateLedgerEntryRequest,
} from "@/types/ledger";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const KEY = "ledger";

export function useLedgerSummary(filters: GetLedgerSummaryFilters) {
  return useQuery({
    queryKey: [KEY, "summary", filters],
    queryFn: () => getLedgerSummaryApi(filters),
  });
}

export function useLedgerAnalytics(filters: GetLedgerAnalyticsFilters) {
  return useQuery({
    queryKey: [KEY, "analytics", filters],
    queryFn: () => getLedgerAnalyticsApi(filters),
    placeholderData: keepPreviousData,
  });
}

export function useLedgerEntries(filters: GetLedgerEntriesFilters) {
  return useQuery({
    queryKey: [KEY, "entries", filters],
    queryFn: () => getLedgerEntriesApi(filters),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateLedger() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useSyncLedger() {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: (data: SyncLedgerRequest) => syncLedgerApi(data),
    onSuccess: invalidate,
  });
}

export function useRecordLedgerEntry() {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: (data: RecordLedgerEntryRequest) => recordLedgerEntryApi(data),
    onSuccess: invalidate,
  });
}

export function useUpdateLedgerEntry() {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLedgerEntryRequest;
    }) => updateLedgerEntryApi(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteLedgerEntry() {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: (id: string) => deleteLedgerEntryApi(id),
    onSuccess: invalidate,
  });
}
