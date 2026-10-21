import * as A from "@/lib/api/clinic";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// ---------- SuperAdmin: clinics ----------
export const useClinics = (p: { search?: string; pageNumber?: number }) =>
  useQuery({
    queryKey: ["clinics", p],
    queryFn: () => A.getClinicsApi({ ...p, pageSize: 100 }),
    placeholderData: keepPreviousData,
  });
export const useClinicDetail = (id: string | null) =>
  useQuery({
    queryKey: ["clinic", id],
    queryFn: () => A.getClinicByIdApi(id!),
    enabled: !!id,
  });
export function useClinicAdminMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["clinics"] });
    qc.invalidateQueries({ queryKey: ["clinic"] });
  };
  return {
    create: useMutation({ mutationFn: A.createClinicApi, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: Parameters<typeof A.updateClinicApi>[1];
      }) => A.updateClinicApi(id, data),
      onSuccess: refresh,
    }),
    resetPassword: useMutation({
      mutationFn: ({ id, pw }: { id: string; pw: string }) =>
        A.resetClinicAdminPasswordApi(id, pw),
    }),
  };
}

// ---------- clinic portal ----------
export const useClinicMe = () =>
  useQuery({
    queryKey: ["clinic-me"],
    queryFn: A.getClinicMeApi,
    staleTime: 60_000,
  });
export const useClinicDashboard = () =>
  useQuery({
    queryKey: ["clinic-dashboard"],
    queryFn: A.getClinicDashboardApi,
  });
export function useClinicSettingsMutations() {
  const qc = useQueryClient();
  return {
    profile: useMutation({
      mutationFn: A.updateClinicProfileApi,
      onSuccess: () => qc.invalidateQueries({ queryKey: ["clinic-me"] }),
    }),
    password: useMutation({ mutationFn: A.changeClinicPasswordApi }),
  };
}

// users
export const useClinicUsers = (p: { search?: string }) =>
  useQuery({
    queryKey: ["clinic-users", p],
    queryFn: () => A.getClinicUsersApi({ ...p, pageSize: 100 }),
    placeholderData: keepPreviousData,
  });
export const useClinicRolesMeta = () =>
  useQuery({
    queryKey: ["clinic-roles-meta"],
    queryFn: A.getClinicRolesMetaApi,
    staleTime: Infinity,
  });
export function useClinicUserMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["clinic-users"] });
    qc.invalidateQueries({ queryKey: ["clinic-me"] });
  };
  return {
    create: useMutation({
      mutationFn: A.createClinicUserApi,
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: Parameters<typeof A.updateClinicUserApi>[1];
      }) => A.updateClinicUserApi(id, data),
      onSuccess: refresh,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        A.setClinicUserStatusApi(id, isActive),
      onSuccess: refresh,
    }),
    resetPassword: useMutation({
      mutationFn: ({ id, pw }: { id: string; pw: string }) =>
        A.resetClinicUserPasswordApi(id, pw),
    }),
    remove: useMutation({
      mutationFn: A.deleteClinicUserApi,
      onSuccess: refresh,
    }),
  };
}

// doctors
export const useClinicDoctors = (
  p: { search?: string; activeOnly?: boolean } = {},
) =>
  useQuery({
    queryKey: ["clinic-doctors", p],
    queryFn: () => A.getClinicDoctorsApi(p),
    placeholderData: keepPreviousData,
  });
export function useSaveClinicDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string | null;
      data: Parameters<typeof A.saveClinicDoctorApi>[1];
    }) => A.saveClinicDoctorApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinic-doctors"] }),
  });
}

// schedules + bookings
export const useClinicSchedules = (p: { doctorId?: string }) =>
  useQuery({
    queryKey: ["clinic-schedules", p],
    queryFn: () => A.getClinicSchedulesApi(p),
  });
export function useClinicScheduleMutations() {
  const qc = useQueryClient();
  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["clinic-schedules"] });
  return {
    create: useMutation({
      mutationFn: A.createClinicScheduleApi,
      onSuccess: refresh,
    }),
    toggle: useMutation({
      mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
        A.toggleClinicScheduleApi(id, isActive),
      onSuccess: refresh,
    }),
  };
}
export const useClinicSlots = (p: { doctorId: string; date: string } | null) =>
  useQuery({
    queryKey: ["clinic-slots", p],
    queryFn: () => A.getClinicSlotsApi(p!),
    enabled: !!p,
  });
export const useClinicBookings = (
  p: { date: string; doctorId?: string } | null,
) =>
  useQuery({
    queryKey: ["clinic-bookings", p],
    queryFn: () => A.getClinicBookingsApi(p!),
    enabled: !!p,
  });
export function useClinicBookingMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    for (const k of [
      "clinic-slots",
      "clinic-bookings",
      "clinic-ledger",
      "clinic-ledger-entries",
      "clinic-dashboard",
    ])
      qc.invalidateQueries({ queryKey: [k] });
  };
  return {
    book: useMutation({
      mutationFn: A.bookClinicAppointmentApi,
      onSuccess: refresh,
    }),
    cancel: useMutation({
      mutationFn: A.cancelClinicBookingApi,
      onSuccess: refresh,
    }),
  };
}

// patients
export const useClinicPatients = (
  p: { search?: string; pageNumber?: number; pageSize?: number },
  enabled = true,
) =>
  useQuery({
    queryKey: ["clinic-patients", p],
    queryFn: () => A.getClinicPatientsApi(p),
    placeholderData: keepPreviousData,
    enabled,
  });
export const useClinicPatientHistory = (id: string | null) =>
  useQuery({
    queryKey: ["clinic-patient-history", id],
    queryFn: () => A.getClinicPatientHistoryApi(id!),
    enabled: !!id,
  });

export function useClinicPatientMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["clinic-patients"] });
    qc.invalidateQueries({ queryKey: ["clinic-patient-history"] });
  };
  return {
    update: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: Parameters<typeof A.updateClinicPatientApi>[1];
      }) => A.updateClinicPatientApi(id, data),
      onSuccess: refresh,
    }),
  };
}

// medicines
export const useMedicineSearch = (
  p: { q?: string; company?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ["clinic-medicine-search", p],
    queryFn: () => A.searchClinicMedicinesApi({ ...p, take: 15 }),
    placeholderData: keepPreviousData,
    enabled,
  });
export const useMedicineCompanies = (q: string) =>
  useQuery({
    queryKey: ["clinic-medicine-companies", q],
    queryFn: () => A.getClinicCompaniesApi({ q, take: 15 }),
    placeholderData: keepPreviousData,
  });
export const useClinicMedicines = (p: {
  search?: string;
  company?: string;
  pageNumber?: number;
  pageSize?: number;
}) =>
  useQuery({
    queryKey: ["clinic-medicines", p],
    queryFn: () => A.getClinicMedicinesApi(p),
    placeholderData: keepPreviousData,
  });
export function useClinicMedicineMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    for (const k of [
      "clinic-medicines",
      "clinic-medicine-search",
      "clinic-medicine-companies",
    ])
      qc.invalidateQueries({ queryKey: [k] });
  };
  return {
    save: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string | null;
        data: Parameters<typeof A.saveClinicMedicineApi>[1];
      }) => A.saveClinicMedicineApi(id, data),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: A.deleteClinicMedicineApi,
      onSuccess: refresh,
    }),
    importRows: useMutation({
      mutationFn: A.importClinicMedicinesApi,
      onSuccess: refresh,
    }),
  };
}

// lab test catalog
export const useClinicTestSearch = (
  p: { q?: string; departmentId?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: ["clinic-test-search", p],
    queryFn: () => A.searchClinicTestsApi({ ...p, take: 20 }),
    placeholderData: keepPreviousData,
    enabled,
  });
export const useClinicTestDepartments = (enabled = true) =>
  useQuery({
    queryKey: ["clinic-test-departments"],
    queryFn: A.getClinicTestDepartmentsApi,
    staleTime: 5 * 60_000,
    enabled,
  });

// prescriptions
export const usePrescriptions = (
  p: Parameters<typeof A.getPrescriptionsApi>[0],
) =>
  useQuery({
    queryKey: ["clinic-prescriptions", p],
    queryFn: () => A.getPrescriptionsApi(p),
    placeholderData: keepPreviousData,
  });
export const usePrescription = (id: string | null) =>
  useQuery({
    queryKey: ["clinic-prescription", id],
    queryFn: () => A.getPrescriptionApi(id!),
    enabled: !!id,
  });
export function usePrescriptionMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    for (const k of [
      "clinic-prescriptions",
      "clinic-prescription",
      "clinic-patients",
      "clinic-patient-history",
      "clinic-bookings",
      "clinic-dashboard",
      "clinic-medicines",
      "clinic-medicine-search",
      "clinic-medicine-companies",
    ])
      qc.invalidateQueries({ queryKey: [k] });
  };
  return {
    save: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string | null;
        data: Parameters<typeof A.savePrescriptionApi>[1];
      }) => A.savePrescriptionApi(id, data),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: A.deletePrescriptionApi,
      onSuccess: refresh,
    }),
  };
}

// ledger
export const useClinicLedgerAnalytics = (
  p: Parameters<typeof A.getClinicLedgerAnalyticsApi>[0],
) =>
  useQuery({
    queryKey: ["clinic-ledger", p],
    queryFn: () => A.getClinicLedgerAnalyticsApi(p),
    placeholderData: keepPreviousData,
  });
export const useClinicLedgerEntries = (
  p: Parameters<typeof A.getClinicLedgerEntriesApi>[0],
) =>
  useQuery({
    queryKey: ["clinic-ledger-entries", p],
    queryFn: () => A.getClinicLedgerEntriesApi(p),
    placeholderData: keepPreviousData,
  });
export function useClinicLedgerMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    for (const k of [
      "clinic-ledger",
      "clinic-ledger-entries",
      "clinic-dashboard",
    ])
      qc.invalidateQueries({ queryKey: [k] });
  };
  return {
    record: useMutation({
      mutationFn: A.recordClinicLedgerEntryApi,
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: Parameters<typeof A.updateClinicLedgerEntryApi>[1];
      }) => A.updateClinicLedgerEntryApi(id, data),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: A.deleteClinicLedgerEntryApi,
      onSuccess: refresh,
    }),
  };
}
