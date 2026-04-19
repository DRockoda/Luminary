import type { PublicUser } from "@luminary/shared";
import { create } from "zustand";
import { api } from "../lib/api";

/**
 * Thrown when the API tells us the account exists but isn't email-verified yet.
 * The caller (login or signup form) catches this and routes the user to the
 * OTP entry page.
 */
export class EmailVerificationRequiredError extends Error {
  email: string;
  constructor(email: string) {
    super("Email verification required");
    this.name = "EmailVerificationRequiredError";
    this.email = email;
  }
}

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: PublicUser | null) => void;
  bootstrap: () => Promise<void>;
  /** Logs in. Throws EmailVerificationRequiredError if the account isn't verified. */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  /** Creates the account but does NOT log in. Returns the email pending verification. */
  signup: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<{ email: string }>;
  /** Verifies a 6-digit OTP. On success, sets the auth user. */
  verifyOtp: (email: string, code: string, rememberMe?: boolean) => Promise<void>;
  /** Resends the OTP to the email (silent for unknown / already-verified addresses). */
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  bootstrap: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<{ user: PublicUser }>("/api/auth/me");
      set({ user: data.user });
    } catch {
      try {
        const { data } = await api.post<{ user: PublicUser }>("/api/auth/refresh");
        set({ user: data.user });
      } catch {
        set({ user: null });
      }
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  login: async (email, password, rememberMe = true) => {
    try {
      const { data } = await api.post<{ user: PublicUser }>("/api/auth/login", {
        email,
        password,
        rememberMe,
      });
      set({ user: data.user });
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { requiresVerification?: boolean; email?: string } };
      };
      if (
        e?.response?.status === 403 &&
        e.response.data?.requiresVerification &&
        e.response.data.email
      ) {
        throw new EmailVerificationRequiredError(e.response.data.email);
      }
      throw err;
    }
  },
  signup: async (input) => {
    const { data } = await api.post<{ requiresVerification: boolean; email: string }>(
      "/api/auth/signup",
      input,
    );
    set({ user: null });
    return { email: data.email };
  },
  verifyOtp: async (email, code, rememberMe = true) => {
    const { data } = await api.post<{ user: PublicUser }>("/api/auth/verify-otp", {
      email,
      code,
      rememberMe,
    });
    set({ user: data.user });
  },
  resendOtp: async (email) => {
    await api.post("/api/auth/resend-otp", { email });
  },
  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      set({ user: null });
    }
  },
}));
