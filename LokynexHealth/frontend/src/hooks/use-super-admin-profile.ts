import {
  changeMySuperAdminPasswordApi,
  getMySuperAdminProfileApi,
  updateMySuperAdminProfileApi,
} from "@/lib/api/super-admin-profile";
import {
  ChangeMySuperAdminPasswordRequest,
  UpdateMySuperAdminProfileRequest,
} from "@/types/super-admin-profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMySuperAdminProfile(enabled = true) {
  return useQuery({
    queryKey: ["superadmin-me"],
    queryFn: getMySuperAdminProfileApi,
    enabled,
  });
}

export function useUpdateMySuperAdminProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMySuperAdminProfileRequest) =>
      updateMySuperAdminProfileApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-me"] }),
  });
}

export function useChangeMySuperAdminPassword() {
  return useMutation({
    mutationFn: (data: ChangeMySuperAdminPasswordRequest) =>
      changeMySuperAdminPasswordApi(data),
  });
}
