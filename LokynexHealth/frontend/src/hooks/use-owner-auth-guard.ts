"use client";

import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

export function useOwnerAuthGuard() {
  const router = useRouter();
  const isAuthenticated = useOwnerAuthStore((s) => s.isAuthenticated);

  const hydrated = useSyncExternalStore(
    (onChange) => useOwnerAuthStore.persist.onFinishHydration(onChange),
    () => useOwnerAuthStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  return hydrated && isAuthenticated;
}
