"use client";

import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useSuperAdminAuthGuard() {
  const router = useRouter();
  const isAuthenticated = useSuperAdminAuthStore(
    (state) => state.isAuthenticated,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/superadmin/login");
    }
  }, [isAuthenticated, router]);

  return isAuthenticated;
}
