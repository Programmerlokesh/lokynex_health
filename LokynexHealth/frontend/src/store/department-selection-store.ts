import { create } from "zustand";
import { persist } from "zustand/middleware";

// Which departments each lab chose to show on the Departments & Tests page.
// Kept per lab (key = tenant id) so two labs opened in the same browser never
// share a selection. A lab that has chosen nothing sees no department.
interface DepartmentSelectionState {
  byLab: Record<string, string[]>;
  /** Tick / untick one department. */
  toggle: (labKey: string, id: string) => void;
  /** Tick (checked = true) or untick many departments at once. */
  setMany: (labKey: string, ids: string[], checked: boolean) => void;
}

export const useDepartmentSelectionStore = create<DepartmentSelectionState>()(
  persist(
    (set) => ({
      byLab: {},
      toggle: (labKey, id) =>
        set((s) => {
          const current = s.byLab[labKey] ?? [];
          const next = current.includes(id)
            ? current.filter((x) => x !== id)
            : [...current, id];
          return { byLab: { ...s.byLab, [labKey]: next } };
        }),
      setMany: (labKey, ids, checked) =>
        set((s) => {
          const current = new Set(s.byLab[labKey] ?? []);
          for (const id of ids) {
            if (checked) current.add(id);
            else current.delete(id);
          }
          return { byLab: { ...s.byLab, [labKey]: [...current] } };
        }),
    }),
    { name: "lokynex-department-selection" },
  ),
);
