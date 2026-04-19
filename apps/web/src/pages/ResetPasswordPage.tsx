import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, apiErrorMessage } from "@/lib/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) return <Navigate to="/auth/forgot-password" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-confirm-page">
      <div className="auth-confirm-card auth-confirm-card--form">
        {done ? (
          <>
            <div className="auth-confirm-icon auth-confirm-icon--success">
              <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
            </div>
            <h1 className="auth-confirm-title">Password updated</h1>
            <p className="auth-confirm-text">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <Link to="/auth" className="auth-confirm-link">
              Continue to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-confirm-title" style={{ marginTop: 12 }}>
              Set a new password
            </h1>
            <p className="auth-confirm-text">Choose a password you haven't used before.</p>
            <form onSubmit={onSubmit} className="auth-confirm-form">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-tertiary hover:text-primary transition-colors"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type={show ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && <p className="auth-confirm-error">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full mt-2 h-[38px]">
                {loading ? <Spinner /> : "Update password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
