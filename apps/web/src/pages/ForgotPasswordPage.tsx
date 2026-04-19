import { ArrowLeft, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, apiErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-confirm-page">
      <div className="auth-confirm-card auth-confirm-card--form">
        <Link to="/auth" className="auth-confirm-back">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
        {sent ? (
          <>
            <div className="auth-confirm-icon auth-confirm-icon--success">
              <MailCheck className="h-7 w-7" strokeWidth={2} />
            </div>
            <h1 className="auth-confirm-title">Check your inbox</h1>
            <p className="auth-confirm-text">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              The link expires in 1 hour.
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-confirm-title" style={{ marginTop: 12 }}>
              Reset your password
            </h1>
            <p className="auth-confirm-text">
              Enter your email and we'll send you a link to set a new password.
            </p>
            <form onSubmit={onSubmit} className="auth-confirm-form">
              <div className="space-y-1.5 text-left">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {error && <p className="auth-confirm-error">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full mt-2 h-[38px]">
                {loading ? <Spinner /> : "Send reset link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
