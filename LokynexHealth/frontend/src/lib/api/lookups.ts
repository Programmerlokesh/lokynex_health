import { apiClient } from "@/lib/api-client";
import { LookupDto, TechnicianDto } from "@/types/lookup";
import { PagedResult } from "@/types/user";

export async function getDoctorsApi(
  search?: string,
): Promise<PagedResult<LookupDto>> {
  const response = await apiClient.get<PagedResult<LookupDto>>("/Doctors", {
    params: { search, pageSize: 50 },
  });
  return response.data;
}

export async function getReferralsApi(
  search?: string,
): Promise<PagedResult<LookupDto>> {
  const response = await apiClient.get<PagedResult<LookupDto>>("/Referrals", {
    params: { search, pageSize: 50 },
  });
  return response.data;
}

export async function getTechniciansApi(
  branchId?: string,
): Promise<PagedResult<TechnicianDto>> {
  const response = await apiClient.get<PagedResult<TechnicianDto>>(
    "/Technicians",
    {
      params: { branchId, pageSize: 100 },
    },
  );
  return response.data;
}
