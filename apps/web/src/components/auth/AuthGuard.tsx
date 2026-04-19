import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-secondary">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
