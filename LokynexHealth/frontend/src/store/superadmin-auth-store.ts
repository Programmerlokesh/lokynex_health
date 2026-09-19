import { create } from "zustand";
import { persist } from "zustand/middleware";

// Deliberately a SEPARATE store from useAuthStore (tenant login) — a
// SuperAdmin session and a lab's own login session must never share state,
// a token, or a storage key.
interface SuperAdminAuthState {
  token: string | null;
  name: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, name: string) => void;
  logout: () => void;
}

export const useSuperAdminAuthStore = create<SuperAdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      name: null,
      isAuthenticated: false,
      setAuth: (token, name) => set({ token, name, isAuthenticated: true }),
      logout: () => set({ token: null, name: null, isAuthenticated: false }),
    }),
    { name: "lokynex-superadmin-auth-storage" },
  ),
);
