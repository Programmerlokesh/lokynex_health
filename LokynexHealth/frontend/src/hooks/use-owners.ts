import {
  createOwnerApi,
  deleteOwnerLedgerEntryApi,
  getMyOwnerProfileApi,
  getOwnerByIdApi,
  getOwnerLedgerAnalyticsApi,
  getOwnerLedgerEntriesApi,
  getOwnersApi,
  recordOwnerLedgerEntryApi,
  setOwnerStatusApi,
  updateMyOwnerProfileApi,
  updateOwnerApi,
  updateOwnerLedgerEntryApi,
} from "@/lib/api/owners";
import {
  CreateOwnerRequest,
  OwnerLedgerEntriesParams,
  OwnerLedgerFilters,
  SaveOwnerLedgerEntryRequest,
  UpdateMyOwnerProfileRequest,
  UpdateOwnerRequest,
} from "@/types/owner";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// ---------- SuperAdmin: manage owners ----------
export function useOwners(params: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["owners", params],
    queryFn: () => getOwnersApi({ ...params, pageSize: 100 }),
    placeholderData: keepPreviousData,
  });
}

export function useOwner(id: string | null) {
  return useQuery({
    queryKey: ["owners", id],
    queryFn: () => getOwnerByIdApi(id!),
    enabled: !!id,
  });
}

export function useCreateOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOwnerRequest) => createOwnerApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owners"] }),
  });
}

export function useUpdateOwner(id: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOwnerRequest) => updateOwnerApi(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owners"] }),
  });
}

export function useSetOwnerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "Active" | "Inactive";
    }) => setOwnerStatusApi(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owners"] }),
  });
}

// ---------- Owner: own profile ----------
export function useMyOwnerProfile(enabled = true) {
  return useQuery({
    queryKey: ["owner-me"],
    queryFn: getMyOwnerProfileApi,
    enabled,
  });
}

export function useUpdateMyOwnerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMyOwnerProfileRequest) =>
      updateMyOwnerProfileApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-me"] }),
  });
}

// ---------- Ledger ----------
// ownerId undefined  => the signed-in Owner's own ledger
// ownerId set        => SuperAdmin looking at that owner's ledger
export function useOwnerLedgerAnalytics(
  ownerId: string | undefined,
  filters: OwnerLedgerFilters,
) {
  return useQuery({
    queryKey: ["owner-ledger", "analytics", ownerId ?? "me", filters],
    queryFn: () => getOwnerLedgerAnalyticsApi(ownerId, filters),
    placeholderData: keepPreviousData,
  });
}

export function useOwnerLedgerEntries(
  ownerId: string | undefined,
  params: OwnerLedgerEntriesParams,
) {
  return useQuery({
    queryKey: ["owner-ledger", "entries", ownerId ?? "me", params],
    queryFn: () => getOwnerLedgerEntriesApi(ownerId, params),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateLedger() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["owner-ledger"] });
}

export function useRecordOwnerLedgerEntry() {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: (data: SaveOwnerLedgerEntryRequest) =>
      recordOwnerLedgerEntryApi(data),
    onSuccess: invalidate,
  });
}

export function useUpdateOwnerLedgerEntry() {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: SaveOwnerLedgerEntryRequest;
    }) => updateOwnerLedgerEntryApi(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteOwnerLedgerEntry() {
  const invalidate = useInvalidateLedger();
  return useMutation({
    mutationFn: (id: string) => deleteOwnerLedgerEntryApi(id),
    onSuccess: invalidate,
  });
}
