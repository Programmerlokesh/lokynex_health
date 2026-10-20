import { clinicApiClient as api } from "@/lib/clinic-api-client";
import { superAdminApiClient } from "@/lib/superadmin-api-client";
import type {
  BookClinicAppointmentRequest,
  ClinicBooking,
  ClinicCompany,
  ClinicDashboard,
  ClinicDetail,
  ClinicDoctor,
  ClinicLedgerEntriesResult,
  ClinicMe,
  ClinicMedicine,
  ClinicPatient,
  ClinicPatientHistory,
  ClinicRolesMeta,
  ClinicSchedule,
  ClinicSlot,
  ClinicSummary,
  ClinicTest,
  ClinicTestDepartment,
  ClinicUser,
  CreateClinicRequest,
  CreateClinicScheduleRequest,
  ImportMedicineRow,
  PagedList,
  Prescription,
  PrescriptionListItem,
  SaveClinicDoctorRequest,
  SaveClinicLedgerEntryRequest,
  SaveClinicMedicineRequest,
  SaveClinicUserRequest,
  SavePrescriptionRequest,
  UpdateClinicProfileRequest,
  UpdateClinicRequest,
} from "@/types/clinic";
import type { LedgerAnalytics } from "@/types/ledger";

/* ============ SuperAdmin: manage clinics ============ */
export const getClinicsApi = async (p: {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}) =>
  (
    await superAdminApiClient.get<PagedList<ClinicSummary>>("/Clinics", {
      params: p,
    })
  ).data;
export const getClinicByIdApi = async (id: string) =>
  (await superAdminApiClient.get<ClinicDetail>(`/Clinics/${id}`)).data;
export const createClinicApi = async (d: CreateClinicRequest) =>
  (await superAdminApiClient.post<{ id: string }>("/Clinics", d)).data;
export const updateClinicApi = async (id: string, d: UpdateClinicRequest) => {
  await superAdminApiClient.put(`/Clinics/${id}`, d);
};
export const resetClinicAdminPasswordApi = async (
  id: string,
  newPassword: string,
) => {
  await superAdminApiClient.post(`/Clinics/${id}/reset-password`, {
    newPassword,
  });
};

/* ============ Clinic portal ============ */
export const getClinicMeApi = async () =>
  (await api.get<ClinicMe>("/clinic/me")).data;
export const getClinicDashboardApi = async () =>
  (await api.get<ClinicDashboard>("/clinic/dashboard")).data;
export const updateClinicProfileApi = async (d: UpdateClinicProfileRequest) => {
  await api.put("/clinic/profile", d);
};
export const changeClinicPasswordApi = async (d: {
  currentPassword: string;
  newPassword: string;
}) => {
  await api.post("/clinic/password", d);
};

/* users */
export const getClinicUsersApi = async (p: {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}) =>
  (await api.get<PagedList<ClinicUser>>("/clinic/users", { params: p })).data;
export const getClinicRolesMetaApi = async () =>
  (await api.get<ClinicRolesMeta>("/clinic/users/meta")).data;
export const createClinicUserApi = async (d: SaveClinicUserRequest) =>
  (await api.post<{ id: string }>("/clinic/users", d)).data;
export const updateClinicUserApi = async (
  id: string,
  d: SaveClinicUserRequest,
) => {
  await api.put(`/clinic/users/${id}`, d);
};
export const setClinicUserStatusApi = async (id: string, isActive: boolean) => {
  await api.patch(`/clinic/users/${id}/status`, { isActive });
};
export const resetClinicUserPasswordApi = async (
  id: string,
  newPassword: string,
) => {
  await api.post(`/clinic/users/${id}/reset-password`, { newPassword });
};
export const deleteClinicUserApi = async (id: string) => {
  await api.delete(`/clinic/users/${id}`);
};

/* doctors */
export const getClinicDoctorsApi = async (
  p: { search?: string; activeOnly?: boolean } = {},
) => (await api.get<ClinicDoctor[]>("/clinic/doctors", { params: p })).data;
export const saveClinicDoctorApi = async (
  id: string | null,
  d: SaveClinicDoctorRequest,
) =>
  id
    ? void (await api.put(`/clinic/doctors/${id}`, d))
    : void (await api.post("/clinic/doctors", d));

/* schedules + bookings */
export const getClinicSchedulesApi = async (p: { doctorId?: string }) =>
  (await api.get<ClinicSchedule[]>("/clinic/schedules", { params: p })).data;
export const createClinicScheduleApi = async (d: CreateClinicScheduleRequest) =>
  (await api.post<{ id: string }>("/clinic/schedules", d)).data;
export const toggleClinicScheduleApi = async (
  id: string,
  isActive: boolean,
) => {
  await api.patch(`/clinic/schedules/${id}/status`, { isActive });
};
export const getClinicSlotsApi = async (p: {
  doctorId: string;
  date: string;
}) =>
  (await api.get<ClinicSlot[]>("/clinic/available-slots", { params: p })).data;
export const bookClinicAppointmentApi = async (
  d: BookClinicAppointmentRequest,
) =>
  (await api.post<{ id: string; serialNo: number }>("/clinic/bookings", d))
    .data;
export const getClinicBookingsApi = async (p: {
  date: string;
  doctorId?: string;
}) => (await api.get<ClinicBooking[]>("/clinic/bookings", { params: p })).data;
export const cancelClinicBookingApi = async (id: string) => {
  await api.post(`/clinic/bookings/${id}/cancel`);
};

/* patients */
export const getClinicPatientsApi = async (p: {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}) =>
  (await api.get<PagedList<ClinicPatient>>("/clinic/patients", { params: p }))
    .data;
export const getClinicPatientHistoryApi = async (id: string) =>
  (await api.get<ClinicPatientHistory>(`/clinic/patients/${id}/history`)).data;

/* medicines */
export const searchClinicMedicinesApi = async (p: {
  q?: string;
  company?: string;
  take?: number;
}) =>
  (await api.get<ClinicMedicine[]>("/clinic/medicines/search", { params: p }))
    .data;
export const getClinicCompaniesApi = async (p: { q?: string; take?: number }) =>
  (await api.get<ClinicCompany[]>("/clinic/medicines/companies", { params: p }))
    .data;
export const getClinicMedicinesApi = async (p: {
  search?: string;
  company?: string;
  pageNumber?: number;
  pageSize?: number;
}) =>
  (await api.get<PagedList<ClinicMedicine>>("/clinic/medicines", { params: p }))
    .data;
export const saveClinicMedicineApi = async (
  id: string | null,
  d: SaveClinicMedicineRequest,
) =>
  id
    ? void (await api.put(`/clinic/medicines/${id}`, d))
    : void (await api.post("/clinic/medicines", d));
export const deleteClinicMedicineApi = async (id: string) => {
  await api.delete(`/clinic/medicines/${id}`);
};
export const importClinicMedicinesApi = async (rows: ImportMedicineRow[]) =>
  (
    await api.post<{ added: number; skipped: number }>(
      "/clinic/medicines/import",
      { rows },
    )
  ).data;

/* lab test catalog */
export const searchClinicTestsApi = async (p: {
  q?: string;
  departmentId?: string;
  take?: number;
}) => (await api.get<ClinicTest[]>("/clinic/tests/search", { params: p })).data;
export const getClinicTestDepartmentsApi = async () =>
  (await api.get<ClinicTestDepartment[]>("/clinic/tests/departments")).data;

/* prescriptions */
export const getPrescriptionsApi = async (p: {
  search?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  pageNumber?: number;
  pageSize?: number;
}) =>
  (
    await api.get<PagedList<PrescriptionListItem>>("/clinic/prescriptions", {
      params: p,
    })
  ).data;
export const getPrescriptionApi = async (id: string) =>
  (await api.get<Prescription>(`/clinic/prescriptions/${id}`)).data;
export const savePrescriptionApi = async (
  id: string | null,
  d: SavePrescriptionRequest,
) =>
  (id
    ? await api.put<{ id: string; rxNo: string }>(
        `/clinic/prescriptions/${id}`,
        d,
      )
    : await api.post<{ id: string; rxNo: string }>("/clinic/prescriptions", d)
  ).data;
export const deletePrescriptionApi = async (id: string) => {
  await api.delete(`/clinic/prescriptions/${id}`);
};

/* ledger */
export const getClinicLedgerAnalyticsApi = async (p: {
  dateFrom?: string;
  dateTo?: string;
  granularity?: string;
}) =>
  (await api.get<LedgerAnalytics>("/clinic/ledger/analytics", { params: p }))
    .data;
export const getClinicLedgerEntriesApi = async (p: {
  dateFrom?: string;
  dateTo?: string;
  entryType?: string;
  search?: string;
  sortDesc?: boolean;
  pageNumber?: number;
  pageSize?: number;
}) =>
  (
    await api.get<ClinicLedgerEntriesResult>("/clinic/ledger/entries", {
      params: p,
    })
  ).data;
export const recordClinicLedgerEntryApi = async (
  d: SaveClinicLedgerEntryRequest,
) => {
  await api.post("/clinic/ledger", d);
};
export const updateClinicLedgerEntryApi = async (
  id: string,
  d: SaveClinicLedgerEntryRequest,
) => {
  await api.put(`/clinic/ledger/${id}`, d);
};
export const deleteClinicLedgerEntryApi = async (id: string) => {
  await api.delete(`/clinic/ledger/${id}`);
};
