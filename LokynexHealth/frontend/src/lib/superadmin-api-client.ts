import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { useSuperAdminAuthStore } from "@/store/superadmin-auth-store";
import axios from "axios";

// ONE axios instance for every "platform" endpoint (Labs, Plans, Subscriptions,
// Notifications, Owners, Owner ledger). Two kinds of people use these pages:
//   • SuperAdmin  -> pages under /superadmin/...  -> SuperAdmin token
//   • Owner       -> pages under /owner/...       -> Owner token
// The token is picked from the page the request is made from, so the two
// sessions can never be mixed up. Never the lab token (lib/api-client.ts).
function isOwnerArea(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/owner")
  );
}

export const superAdminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

superAdminApiClient.interceptors.request.use((config) => {
  const token = isOwnerArea()
    ? useOwnerAuthStore.getState().token
    : useSuperAdminAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

superAdminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login call er 401 mane bad password, expired session na.
    const isAuthCall = String(error.config?.url ?? "").includes("/Auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      if (isOwnerArea()) useOwnerAuthStore.getState().logout();
      else useSuperAdminAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
