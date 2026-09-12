import { apiClient } from "@/lib/api-client";
import {
  CreateDoctorRequest,
  CreateReferralRequest,
  CreateTechnicianRequest,
  DoctorFullDto,
  ReferralFullDto,
  TechnicianFullDto,
} from "@/types/directory";
import { PagedResult } from "@/types/user";

export async function getDoctorsListApi(
  search?: string,
): Promise<PagedResult<DoctorFullDto>> {
  const res = await apiClient.get<PagedResult<DoctorFullDto>>("/Doctors", {
    params: { search, pageSize: 50 },
  });
  return res.data;
}
export async function createDoctorApi(
  data: CreateDoctorRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Doctors", data);
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
export async function createReferralApi(
  data: CreateReferralRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Referrals", data);
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
export async function createTechnicianApi(
  data: CreateTechnicianRequest,
): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/Technicians", data);
  return res.data;
}
