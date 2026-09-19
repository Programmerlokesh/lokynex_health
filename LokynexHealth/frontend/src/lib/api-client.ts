import { useAuthStore } from "@/store/auth-store";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT token to every outgoing request, automatically.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — if the token expired or is invalid, log the user out
// and redirect to login, instead of every single API call needing its own
// try/catch for this exact case.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login endpoint er 401 mane "password vul", session expire na.
    // Age ekhane page reload hoto, tai error message ta muche jeto.
    const isAuthCall = String(error.config?.url ?? "").includes("/Auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        // purano cookie muchhe dao, jate proxy.ts ar store ek mot thake
        document.cookie = "lokynex-token=; path=/; max-age=0";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
