import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/store/authStore";

const RESEND_COOLDOWN_S = 30;

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const resendOtp = useAuthStore((s) => s.resendOtp);

  const email = params.get("email") ?? "";
  const from =
    (location.state as { from?: string } | null)?.from ?? "/app/calendar";

  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = useMemo(() => digits.join(""), [digits]);
  const filled = code.length === 6;

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-submit when all 6 boxes are filled.
  useEffect(() => {
    if (filled && !submitting) {
      void onVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled]);

  // Already authed → bounce to the app.
  if (user) return <Navigate to={from} replace />;
  // No email param → must restart from sign-in.
  if (!email) return <Navigate to="/auth" replace />;

  function setDigit(i: number, value: string) {
    const v = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    setError(null);
    if (v && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    const last = Math.min(text.length, 5);
    inputsRef.current[last]?.focus();
  }

  async function onVerify() {
    if (!filled) return;
    setSubmitting(true);
    setError(null);
    try {
      await verifyOtp(email, code, true);
      toast.success("Email verified", "Welcome to Luminary.");
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid code. Try again."));
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (cooldown > 0) return;
    try {
      await resendOtp(email);
      toast.success("Code sent", "Check your inbox for a fresh code.");
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      toast.error("Couldn't resend", apiErrorMessage(err));
    }
  }

  return (
    <div className="auth-confirm-page">
      <div className="auth-confirm-card">
        <div className="auth-confirm-icon auth-confirm-icon--loading">
          <MailIcon />
        </div>
        <h1 className="auth-confirm-title">Verify your email</h1>
        <p className="auth-confirm-text">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
          unlock your journal.
        </p>

        <div className="otp-row" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              className="otp-box"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              disabled={submitting}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {error && <p className="otp-error">{error}</p>}

        <Button
          type="button"
          onClick={onVerify}
          disabled={!filled || submitting}
          className="w-full mt-1"
        >
          {submitting ? <Spinner /> : "Verify and continue"}
        </Button>

        <div className="otp-actions">
          <button
            type="button"
            className="otp-resend"
            onClick={onResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
          <Link to="/auth" className="auth-confirm-link">
            Use a different email
          </Link>
        </div>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
