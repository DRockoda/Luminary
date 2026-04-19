import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api";
import { EmailVerificationRequiredError, useAuthStore } from "@/store/authStore";

type Mode = "login" | "signup";

export default function AuthPage() {
  const { user, login, signup } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/app/calendar";

  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "login",
  );

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup") setMode("signup");
    else if (m === "login") setMode("login");
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 8)
          throw new Error("Password must be at least 8 characters");
        if (password !== confirm) throw new Error("Passwords don't match");
        const { email: pendingEmail } = await signup({
          email,
          password,
          displayName: displayName || undefined,
        });
        toast.success("Check your email", "We sent you a 6-digit code.");
        navigate(
          `/auth/verify-email?email=${encodeURIComponent(pendingEmail)}`,
          { replace: true, state: { from } },
        );
        return;
      }
      try {
        await login(email, password, rememberMe);
        toast.success("Welcome back");
        navigate(from, { replace: true });
      } catch (err) {
        if (err instanceof EmailVerificationRequiredError) {
          toast.success("Check your email", "Enter the 6-digit code we just sent.");
          navigate(
            `/auth/verify-email?email=${encodeURIComponent(err.email)}`,
            { replace: true, state: { from } },
          );
          return;
        }
        throw err;
      }
    } catch (err) {
      toast.error(
        mode === "signup" ? "Couldn't create account" : "Couldn't sign in",
        apiErrorMessage(err),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-left">
        <Link to="/" className="auth-logo-link" aria-label="Luminary home">
          <LogoMark />
          <span>Luminary</span>
        </Link>

        <div className="auth-form-wrapper">
          <div className="auth-form">
            <h1 className="auth-headline">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="auth-subhead">
              {mode === "signup"
                ? "Start a private space for the things you don't say out loud."
                : "Sign in to pick up where you left off."}
            </p>

            <form onSubmit={onSubmit} className="auth-form-fields" noValidate>
              {mode === "signup" && (
                <div className="auth-field">
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    aria-label="Display name"
                  />
                </div>
              )}

              <div className="auth-field">
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Email"
                />
              </div>

              <div className="auth-field">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup" ? "Password (min 8 characters)" : "Password"
                  }
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="auth-password-toggle"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {mode === "signup" && (
                <div className="auth-field">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm password"
                    aria-label="Confirm password"
                  />
                </div>
              )}

              {mode === "login" ? (
                <div className="auth-recovery-row">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    to="/auth/forgot-password"
                    className="auth-recovery-link"
                  >
                    Forgot password?
                  </Link>
                </div>
              ) : (
                <p className="auth-fineprint">
                  By creating an account you agree to our{" "}
                  <Link to="/" className="auth-link-inline">Terms</Link> and{" "}
                  <Link to="/" className="auth-link-inline">Privacy Policy</Link>.
                </p>
              )}

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                onMouseEnter={() => void import("@/pages/CalendarPage")}
              >
                {loading ? (
                  <Spinner />
                ) : mode === "signup" ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="auth-switch-mode">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="auth-switch-link"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="auth-switch-link"
                  >
                    Create one
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="auth-foot-note">
          End-to-end encrypted · No ads · No tracking
        </p>
      </section>

      <aside className="auth-right" aria-hidden>
        <AuthVisual />
      </aside>
    </div>
  );
}

function LogoMark() {
  return (
    <span className="auth-logo-mark" aria-hidden>
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <circle cx="12" cy="12" r="8" opacity="0.5" />
      </svg>
    </span>
  );
}
