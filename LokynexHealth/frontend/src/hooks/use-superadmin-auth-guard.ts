"use client";

import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

export function useSuperAdminAuthGuard() {
  const router = useRouter();
  const isAuthenticated = useSuperAdminAuthStore(
    (state) => state.isAuthenticated,
  );

  const hydrated = useSyncExternalStore(
    (onChange) => useSuperAdminAuthStore.persist.onFinishHydration(onChange),
    () => useSuperAdminAuthStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/superadmin/login");
    }
  }, [hydrated, isAuthenticated, router]);

  return hydrated && isAuthenticated;
}
