import axios, { AxiosError } from "axios";
import type { PublicUser } from "@luminary/shared";
import {
  clearClientAuthSession,
  getMemoryAccessToken,
  getPersistedRefreshToken,
  persistRefreshToken,
  setMemoryAccessToken,
} from "./authSession";
import { resolveApiBaseURL } from "./apiBaseUrl";

export const api = axios.create({
  baseURL: resolveApiBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const t = getMemoryAccessToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

let refreshing: Promise<void> | null = null;

type RefreshResponse = { user: PublicUser; accessToken: string; refreshToken: string };

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config;
    const status = error.response?.status;
    if (
      status === 401 &&
      original &&
      !(original as { _retry?: boolean })._retry &&
      !original.url?.includes("/api/auth/") &&
      !original.url?.includes("/api/admin/")
    ) {
      (original as { _retry?: boolean })._retry = true;
      try {
        if (!refreshing) {
          refreshing = (async () => {
            const rt = getPersistedRefreshToken();
            if (!rt) throw new Error("No refresh token");
            const { data } = await api.post<RefreshResponse>("/api/auth/refresh", {
              refreshToken: rt,
            });
            setMemoryAccessToken(data.accessToken);
            persistRefreshToken(data.refreshToken);
            const { useAuthStore } = await import("../store/authStore");
            useAuthStore.getState().setUser(data.user);
          })();
        }
        await refreshing;
        refreshing = null;
        return api.request(original);
      } catch (e) {
        refreshing = null;
        clearClientAuthSession();
        const { useAuthStore } = await import("../store/authStore");
        useAuthStore.getState().setUser(null);
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          if (path.startsWith("/admin")) {
            window.location.assign("/admin");
          } else if (!path.startsWith("/auth")) {
            window.location.assign("/auth");
          }
        }
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const axErr = err as AxiosError<{ error?: string; details?: unknown }>;
  return axErr?.response?.data?.error || axErr?.message || fallback;
}
