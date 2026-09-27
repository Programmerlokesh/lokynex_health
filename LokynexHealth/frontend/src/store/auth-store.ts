import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  userId: string;
  name: string;
  role: string;
  // The current tenant's own lab name (e.g. "Sunrise Diagnostics") — shown in
  // the Topbar instead of a generic "Lokynex Health" label, so a lab's own
  // staff always see which lab they're actually signed into.
  labName?: string | null;
  // Flat "ModuleName:View" style strings from the JWT's permissions claim.
  // Empty for LabAdmin — a LabAdmin's access is role-based (sees everything),
  // never grid-based. The Sidebar uses this to hide modules a plain user
  // hasn't been granted access to.
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: "lokynex-auth-storage" },
  ),
);
