"use client";

import { useClinicAuthStore } from "@/store/clinic-auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

export function useClinicAuthGuard() {
  const router = useRouter();
  const isAuthenticated = useClinicAuthStore((s) => s.isAuthenticated);

  const hydrated = useSyncExternalStore(
    (onChange) => useClinicAuthStore.persist.onFinishHydration(onChange),
    () => useClinicAuthStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.push("/login");
  }, [hydrated, isAuthenticated, router]);

  return hydrated && isAuthenticated;
}
