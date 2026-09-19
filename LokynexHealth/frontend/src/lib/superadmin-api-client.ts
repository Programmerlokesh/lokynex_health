import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import axios from "axios";

// A dedicated axios instance for SuperAdmin-only endpoints (Labs, Plans,
// Subscriptions, Notifications) — attaches the SuperAdmin token, never the
// tenant token, and on 401 redirects to the SuperAdmin login, never the
// tenant one. Kept fully separate from lib/api-client.ts.
export const superAdminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

superAdminApiClient.interceptors.request.use((config) => {
  const token = useSuperAdminAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

superAdminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSuperAdminAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/superadmin/login";
      }
    }
    return Promise.reject(error);
  },
);
