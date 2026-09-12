import {
  createDoctorApi,
  createReferralApi,
  createTechnicianApi,
  getDoctorsListApi,
  getReferralsListApi,
  getTechniciansListApi,
} from "@/lib/api/directory";
import {
  CreateDoctorRequest,
  CreateReferralRequest,
  CreateTechnicianRequest,
} from "@/types/directory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors-list"] }),
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
