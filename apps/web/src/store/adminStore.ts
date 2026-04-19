import { create } from "zustand";
import { adminApi } from "@/lib/adminApi";

export interface AdminUser {
  id: string;
  username: string;
}

interface AdminState {
  admin: AdminUser | null;
  initialized: boolean;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  initialized: false,
  bootstrap: async () => {
    try {
      const { data } = await adminApi.get<{ admin: AdminUser }>("/api/admin/me");
      set({ admin: data.admin });
    } catch {
      set({ admin: null });
    } finally {
      set({ initialized: true });
    }
  },
  login: async (username, password) => {
    const { data } = await adminApi.post<{ admin: AdminUser }>("/api/admin/login", {
      username,
      password,
    });
    set({ admin: data.admin });
  },
  logout: async () => {
    try {
      await adminApi.post("/api/admin/logout");
    } finally {
      set({ admin: null });
    }
  },
}));
