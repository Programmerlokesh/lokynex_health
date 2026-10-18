import { useAuthStore } from "@/store/auth-store";
import { useDepartmentSelectionStore } from "@/store/department-selection-store";
import { useCallback, useMemo } from "react";

const EMPTY: string[] = [];

/** Reads the lab (tenant) id out of the JWT so each lab keeps its own selection. */
function tenantIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { tenant_id?: string };
    return claims.tenant_id ?? null;
  } catch {
    return null;
  }
}

/**
 * The departments this lab chose to use. Only these are shown on the
 * Departments & Tests page; every other department stays hidden.
 */
export function useDepartmentSelection() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.userId);
  const labKey = useMemo(
    () => tenantIdFromToken(token) ?? userId ?? "default",
    [token, userId],
  );

  const ids = useDepartmentSelectionStore((s) => s.byLab[labKey] ?? EMPTY);
  const toggleInStore = useDepartmentSelectionStore((s) => s.toggle);
  const setManyInStore = useDepartmentSelectionStore((s) => s.setMany);

  const selectedIds = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback(
    (id: string) => toggleInStore(labKey, id),
    [toggleInStore, labKey],
  );
  const setMany = useCallback(
    (list: string[], checked: boolean) => setManyInStore(labKey, list, checked),
    [setManyInStore, labKey],
  );
  /** Make a department visible (e.g. the one that was just created). */
  const select = useCallback(
    (id: string) => setManyInStore(labKey, [id], true),
    [setManyInStore, labKey],
  );

  return { selectedIds, toggle, setMany, select };
}
