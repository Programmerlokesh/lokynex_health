import {
  createDirectoryRecordApi,
  createDoctorApi,
  createReferralApi,
  createTechnicianApi,
  deleteDirectoryRecordApi,
  getDoctorsListApi,
  getReferralsListApi,
  getTechniciansListApi,
  setDirectoryStatusApi,
  updateDirectoryRecordApi,
} from "@/lib/api/directory";
import {
  CreateDoctorRequest,
  CreateReferralRequest,
  CreateTechnicianRequest,
  DirectoryKind,
  DirectoryPayload,
  DirectoryRecord,
} from "@/types/directory";
import { PagedResult } from "@/types/user";
import {
  QueryClient,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// Directory page lists
const LIST_KEY: Record<DirectoryKind, string> = {
  doctor: "doctors-list",
  referral: "referrals-list",
  technician: "technicians-list",
};

// Dropdown lookups used by Orders / Commission / Doctor-clinic screens
const LOOKUP_KEY: Record<DirectoryKind, string> = {
  doctor: "doctors",
  referral: "referrals",
  technician: "technicians",
};

type ListData = PagedResult<DirectoryRecord>;

function refreshDirectory(qc: QueryClient, kind: DirectoryKind) {
  qc.invalidateQueries({ queryKey: [LIST_KEY[kind]] });
  qc.invalidateQueries({ queryKey: [LOOKUP_KEY[kind]] });
}

// ---------------------------------------------------------------------
// lists
// ---------------------------------------------------------------------
export function useDoctorsList(search: string) {
  return useQuery({
    queryKey: ["doctors-list", search],
    queryFn: () => getDoctorsListApi(search || undefined),
  });
}

export function useReferralsList(search: string) {
  return useQuery({
    queryKey: ["referrals-list", search],
    queryFn: () => getReferralsListApi(search || undefined),
  });
}

export function useTechniciansList(search: string) {
  return useQuery({
    queryKey: ["technicians-list", search],
    queryFn: () => getTechniciansListApi(search || undefined),
  });
}

// ---------------------------------------------------------------------
// typed create hooks (kept for compatibility)
// ---------------------------------------------------------------------
export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDoctorRequest) => createDoctorApi(data),
    onSuccess: () => refreshDirectory(qc, "doctor"),
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReferralRequest) => createReferralApi(data),
    onSuccess: () => refreshDirectory(qc, "referral"),
  });
}

export function useCreateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTechnicianRequest) => createTechnicianApi(data),
    onSuccess: () => refreshDirectory(qc, "technician"),
  });
}

// ---------------------------------------------------------------------
// generic create / edit / delete / status (one hook per action, any kind)
// ---------------------------------------------------------------------
export function useCreateDirectoryRecord(kind: DirectoryKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DirectoryPayload) =>
      createDirectoryRecordApi(kind, data),
    onSuccess: () => refreshDirectory(qc, kind),
  });
}

export function useUpdateDirectoryRecord(kind: DirectoryKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DirectoryPayload }) =>
      updateDirectoryRecordApi(kind, id, data),
    onSuccess: () => refreshDirectory(qc, kind),
  });
}

export function useDeleteDirectoryRecord(kind: DirectoryKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDirectoryRecordApi(kind, id),
    onSuccess: () => refreshDirectory(qc, kind),
  });
}

/**
 * Activate / deactivate with an OPTIMISTIC update: the switch flips instantly in
 * every cached list, and is rolled back if the server rejects it.
 */
export function useSetDirectoryStatus(kind: DirectoryKind) {
  const qc = useQueryClient();
  const listKey = [LIST_KEY[kind]];

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setDirectoryStatusApi(kind, id, isActive),

    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: listKey });
      const snapshots: [QueryKey, ListData | undefined][] =
        qc.getQueriesData<ListData>({ queryKey: listKey });

      const next = isActive ? "Active" : "Inactive";
      qc.setQueriesData<ListData>({ queryKey: listKey }, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((r) =>
                r.id === id ? { ...r, status: next } : r,
              ),
            }
          : old,
      );
      return { snapshots };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    onSettled: () => refreshDirectory(qc, kind),
  });
}

import {
  createDoctorApi,
  createReferralApi,
  createTechnicianApi,
  getDoctorsListApi,
  getReferralsListApi,
  getTechniciansListApi,
  setDoctorStatusApi,
  updateDoctorApi,
} from "@/lib/api/directory";
import {
  CreateDoctorRequest,
  CreateReferralRequest,
  CreateTechnicianRequest,
  UpdateDoctorRequest,
} from "@/types/directory";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/** "doctors-list" = directory / doctors tab, "doctors" = pickers (lookups). */
function invalidateDoctors(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["doctors-list"] });
  qc.invalidateQueries({ queryKey: ["doctors"] });
}

export function useDoctorsList(search: string) {
  return useQuery({
    queryKey: ["doctors-list", search],
    queryFn: () => getDoctorsListApi(search || undefined),
  });
}
export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDoctorRequest) => createDoctorApi(data),
    onSuccess: () => invalidateDoctors(qc),
  });
}
export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDoctorRequest }) =>
      updateDoctorApi(id, data),
    onSuccess: () => invalidateDoctors(qc),
  });
}
export function useSetDoctorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setDoctorStatusApi(id, isActive),
    onSuccess: () => {
      invalidateDoctors(qc);
      qc.invalidateQueries({ queryKey: ["doctor-clinic-schedules"] });
    },
  });
}

export function useReferralsList(search: string) {
  return useQuery({
    queryKey: ["referrals-list", search],
    queryFn: () => getReferralsListApi(search || undefined),
  });
}
export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReferralRequest) => createReferralApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referrals-list"] }),
  });
}

export function useTechniciansList(search: string) {
  return useQuery({
    queryKey: ["technicians-list", search],
    queryFn: () => getTechniciansListApi(search || undefined),
  });
}
export function useCreateTechnician() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTechnicianRequest) => createTechnicianApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["technicians-list"] }),
  });
}