import { create } from "zustand";
import { persist } from "zustand/middleware";

// A SEPARATE store from the lab login and the SuperAdmin login — an Owner
// session must never share state, a token or a storage key with either.
export interface OwnerSession {
  id: string;
  name: string;
  role: string; // CEO / Manager / Marketing Team ...
}

interface OwnerAuthState {
  token: string | null;
  owner: OwnerSession | null;
  isAuthenticated: boolean;
  setAuth: (token: string, owner: OwnerSession) => void;
  logout: () => void;
}

export const useOwnerAuthStore = create<OwnerAuthState>()(
  persist(
    (set) => ({
      token: null,
      owner: null,
      isAuthenticated: false,
      setAuth: (token, owner) => set({ token, owner, isAuthenticated: true }),
      logout: () => set({ token: null, owner: null, isAuthenticated: false }),
    }),
    { name: "lokynex-owner-auth-storage" },
  ),
);
