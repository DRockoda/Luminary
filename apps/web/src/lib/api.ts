import axios, { AxiosError } from "axios";
import { resolveApiBaseURL } from "./apiBaseUrl";

export const api = axios.create({
  baseURL: resolveApiBaseURL(),
  withCredentials: true,
});

let refreshing: Promise<void> | null = null;

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
          refreshing = api.post("/api/auth/refresh").then(() => undefined);
        }
        await refreshing;
        refreshing = null;
        return api.request(original);
      } catch (e) {
        refreshing = null;
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
