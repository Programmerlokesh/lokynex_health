import { useAuthStore } from "@/store/auth-store";

const MODULE = "OrderListAndReports";

/** Lab Admin can do everything; staff follow the module permission grid. */
export function useOrderPermissions() {
  const role = useAuthStore((s) => s.user?.role);
  const permissions = useAuthStore((s) => s.user?.permissions);
  const isAdmin = role === "LabAdmin";
  const has = (action: string) =>
    isAdmin || (permissions ?? []).includes(`${MODULE}:${action}`);
  return { canEdit: has("Edit"), canDelete: has("Delete") };
}
