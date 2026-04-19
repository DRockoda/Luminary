import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/lib/api";
import { useAdminStore } from "@/store/adminStore";

export default function AdminLoginPage() {
  const { admin, initialized, bootstrap, login } = useAdminStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) bootstrap();
  }, [initialized, bootstrap]);

  if (admin) return <Navigate to="/admin/dashboard" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Sign in failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon">
          <Lock className="h-5 w-5" strokeWidth={2} />
        </div>
        <h1 className="admin-login-title">Admin Access</h1>
        <p className="admin-login-subtitle">Authorized personnel only.</p>
        <form onSubmit={onSubmit} className="admin-login-form">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="admin-login-error">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-2 h-[40px]">
            {loading ? <Spinner /> : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
