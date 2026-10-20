import { useClinicAuthStore } from "@/store/clinic-auth-store";
import axios from "axios";

// Axios instance for every /api/clinic/* endpoint. It ONLY ever sends the clinic token.
export const clinicApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

clinicApiClient.interceptors.request.use((config) => {
  const token = useClinicAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

clinicApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 = session expired, user deactivated or clinic suspended -> sign out.
    if (error.response?.status === 401) {
      useClinicAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
