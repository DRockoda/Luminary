import type { PublicUser } from "@luminary/shared";
import { create } from "zustand";
import { api } from "../lib/api";
import {
  clearClientAuthSession,
  getPersistedRefreshToken,
  persistRefreshToken,
  setMemoryAccessToken,
} from "../lib/authSession";

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

type AuthTokensResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

function applySessionFromAuthResponse(data: AuthTokensResponse): void {
  setMemoryAccessToken(data.accessToken);
  persistRefreshToken(data.refreshToken);
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
  }) => Promise<{ email: string; resentVerification?: boolean }>;
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
      // Prefer httpOnly cookie session when it works; drop any stale in-memory Bearer.
      setMemoryAccessToken(null);
      set({ user: data.user });
    } catch {
      const savedToken = getPersistedRefreshToken();
      if (!savedToken) {
        set({ user: null });
      } else {
        try {
          const { data } = await api.post<AuthTokensResponse>("/api/auth/refresh", {
            refreshToken: savedToken,
          });
          applySessionFromAuthResponse(data);
          set({ user: data.user });
        } catch {
          clearClientAuthSession();
          set({ user: null });
        }
      }
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  login: async (email, password, rememberMe = true) => {
    try {
      const { data } = await api.post<AuthTokensResponse>("/api/auth/login", {
        email,
        password,
        rememberMe,
      });
      applySessionFromAuthResponse(data);
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
    const { data } = await api.post<{
      requiresVerification: boolean;
      email: string;
      resentVerification?: boolean;
    }>(
      "/api/auth/signup",
      input,
    );
    set({ user: null });
    return { email: data.email, resentVerification: data.resentVerification };
  },
  verifyOtp: async (email, code, rememberMe = true) => {
    const { data } = await api.post<AuthTokensResponse>("/api/auth/verify-otp", {
      email,
      code,
      rememberMe,
    });
    applySessionFromAuthResponse(data);
    set({ user: data.user });
  },
  resendOtp: async (email) => {
    await api.post("/api/auth/resend-otp", { email });
  },
  logout: async () => {
    const rt = getPersistedRefreshToken();
    try {
      await api.post("/api/auth/logout", rt ? { refreshToken: rt } : {});
    } finally {
      clearClientAuthSession();
      set({ user: null });
    }
  },
}));
