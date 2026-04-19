import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAdminStore } from "@/store/adminStore";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, initialized, bootstrap } = useAdminStore();

  useEffect(() => {
    if (!initialized) bootstrap();
  }, [initialized, bootstrap]);

  if (!initialized) {
    return (
      <div className="admin-theme min-h-screen flex items-center justify-center bg-app text-secondary">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!admin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
