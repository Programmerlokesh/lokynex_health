import { superAdminLoginApi } from "@/lib/api/superadmin-auth";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import { SuperAdminLoginRequest } from "@/types/superadmin-auth";
import { useMutation } from "@tanstack/react-query";

export function useSuperAdminLogin() {
  const setAuth = useSuperAdminAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: (data: SuperAdminLoginRequest) => superAdminLoginApi(data),
    onSuccess: (result) => setAuth(result.token, result.name),
  });
}
