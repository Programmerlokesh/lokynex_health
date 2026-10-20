import { create } from "zustand";
import { persist } from "zustand/middleware";

// A SEPARATE store from lab / SuperAdmin / Owner — a clinic session never shares
// state, a token or a storage key with any of them.
export interface ClinicSession {
  id: string;
  name: string;
  role: string; // "ClinicAdmin" | Doctor | Receptionist ...
  clinicId: string;
  clinicName: string;
  isAdmin: boolean;
  permissions: string[]; // "prescriptions:view" ...
}

interface ClinicAuthState {
  token: string | null;
  session: ClinicSession | null;
  isAuthenticated: boolean;
  setAuth: (token: string, session: ClinicSession) => void;
  logout: () => void;
}

export const useClinicAuthStore = create<ClinicAuthState>()(
  persist(
    (set) => ({
      token: null,
      session: null,
      isAuthenticated: false,
      setAuth: (token, session) =>
        set({ token, session, isAuthenticated: true }),
      logout: () => set({ token: null, session: null, isAuthenticated: false }),
    }),
    { name: "lokynex-clinic-auth-storage" },
  ),
);
