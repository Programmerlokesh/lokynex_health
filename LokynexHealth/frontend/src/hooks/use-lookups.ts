import {
  getDoctorsApi,
  getReferralsApi,
  getTechniciansApi,
} from "@/lib/api/lookups";
import { useQuery } from "@tanstack/react-query";

export function useDoctors(search: string) {
  return useQuery({
    queryKey: ["doctors", search],
    queryFn: () => getDoctorsApi(search || undefined),
  });
}

export function useReferrals(search: string) {
  return useQuery({
    queryKey: ["referrals", search],
    queryFn: () => getReferralsApi(search || undefined),
  });
}

export function useTechnicians(branchId: string | null) {
  return useQuery({
    queryKey: ["technicians", branchId],
    queryFn: () => getTechniciansApi(branchId ?? undefined),
    enabled: !!branchId, // don't fetch until a branch is chosen — avoids a wasted request
  });
}
