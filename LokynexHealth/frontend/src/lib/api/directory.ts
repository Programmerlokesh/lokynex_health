import { apiClient } from "@/lib/api-client";
import {
  CreateDoctorRequest,
  CreateReferralRequest,
  CreateTechnicianRequest,
  DirectoryKind,
  DirectoryPayload,
  DoctorFullDto,
  ReferralFullDto,
  TechnicianFullDto,
} from "@/types/directory";
import { PagedResult } from "@/types/user";

const BASE: Record<DirectoryKind, string> = {
  doctor: "/Doctors",
  referral: "/Referrals",
  technician: "/Technicians",
};

// ---------------- lists ----------------
export async function getDoctorsListApi(
  search?: string,
): Promise<PagedResult<DoctorFullDto>> {
  const res = await apiClient.get<PagedResult<DoctorFullDto>>("/Doctors", {
    params: { search, pageSize: 50 },
  });
  return res.data;
}

export async function getReferralsListApi(
  search?: string,
): Promise<PagedResult<ReferralFullDto>> {
  const res = await apiClient.get<PagedResult<ReferralFullDto>>("/Referrals", {
    params: { search, pageSize: 50 },
  });
  return res.data;
}

export async function getTechniciansListApi(
  search?: string,
): Promise<PagedResult<TechnicianFullDto>> {
  const res = await apiClient.get<PagedResult<TechnicianFullDto>>(
    "/Technicians",
    { params: { search, pageSize: 50 } },
  );
  return res.data;
}

// ---------------- create (typed, used by other screens) ----------------
export async function createDoctorApi(
  data: CreateDoctorRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Doctors", data);
  return res.data;
}

export async function createReferralApi(
  data: CreateReferralRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Referrals", data);
  return res.data;
}

export async function createTechnicianApi(
  data: CreateTechnicianRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Technicians", data);
  return res.data;
}

// ---------------- generic create / edit / status / delete ----------------
export async function createDirectoryRecordApi(
  kind: DirectoryKind,
  data: DirectoryPayload,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>(BASE[kind], data);
  return res.data;
}

export async function updateDirectoryRecordApi(
  kind: DirectoryKind,
  id: string,
  data: DirectoryPayload,
): Promise<void> {
  await apiClient.put(`${BASE[kind]}/${id}`, data);
}

export async function setDirectoryStatusApi(
  kind: DirectoryKind,
  id: string,
  isActive: boolean,
): Promise<void> {
  await apiClient.patch(`${BASE[kind]}/${id}/status`, { isActive });
}

export async function deleteDirectoryRecordApi(
  kind: DirectoryKind,
  id: string,
): Promise<void> {
  await apiClient.delete(`${BASE[kind]}/${id}`);
}
