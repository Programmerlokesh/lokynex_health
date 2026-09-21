import {
  getMyNotificationsApi,
  markMyNotificationsReadApi,
} from "@/lib/api/my-notifications";
import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Polls the lab's inbox so a renewal reminder sent from the SuperAdmin console
 * appears without the user reloading. 60s is a deliberate compromise — short
 * enough that a reminder lands while the user is still on screen, long enough
 * that it costs one request a minute per session.
 */
const POLL_INTERVAL_MS = 60_000;

export function useMyNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => getMyNotificationsApi({ take: 50 }),
    enabled: isAuthenticated,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    // A lab user without a tenant-scoped token gets a 401 here; retrying
    // would just trigger the global logout interceptor repeatedly.
    retry: false,
  });
}

export function useMarkMyNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationIds: string[] = []) =>
      markMyNotificationsReadApi(notificationIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-notifications"] }),
  });
}
