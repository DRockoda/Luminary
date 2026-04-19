import { lazy, Suspense, useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { HotToaster } from "@/components/ui/hot-toaster";
import { PageLoader } from "@/components/layout/PageLoader";
import { PublicPageTransition } from "@/components/layout/PublicPageTransition";
import { PageTransitionOutlet } from "@/components/layout/PageTransitionOutlet";
import { applyColorTheme } from "@/lib/theme";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { useAuthStore } from "@/store/authStore";

const AdminAnnouncementsPage = lazy(() => import("@/pages/admin/AdminAnnouncementsPage"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminFeedbackPage = lazy(() => import("@/pages/admin/AdminFeedbackPage"));
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminUserDetailPage = lazy(() => import("@/pages/admin/AdminUserDetailPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const DayPage = lazy(() => import("@/pages/DayPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const StatsPage = lazy(() => import("@/pages/StatsPage"));
const TrashPage = lazy(() => import("@/pages/TrashPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <PageTransitionOutlet />
      </AppShell>
    </AuthGuard>
  );
}

function AdminLayout() {
  return (
    <AdminGuard>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminGuard>
  );
}

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const { isMaintenanceMode, isLoading: maintenanceLoading } = useMaintenanceMode(!isAdminRoute);

  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (user?.theme) applyColorTheme(user.theme);
  }, [user?.theme]);

  if (!isAdminRoute && maintenanceLoading) {
    return <PageLoader />;
  }
  if (!isAdminRoute && isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicPageTransition />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route path="/admin" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
          </Route>

          <Route element={<ProtectedLayout />}>
            <Route path="/app" element={<Navigate to="/app/calendar" replace />} />
            <Route path="/app/calendar" element={<CalendarPage />} />
            <Route path="/app/day/:date" element={<DayPage />} />
            <Route path="/app/stats" element={<StatsPage />} />
            <Route path="/app/trash" element={<TrashPage />} />
            <Route path="/app/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
          <Route path="/stats" element={<Navigate to="/app/stats" replace />} />
          <Route path="/trash" element={<Navigate to="/app/trash" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="/day/:date" element={<LegacyDayRedirect />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <HotToaster />
      <InstallPrompt />
    </>
  );
}

function LegacyDayRedirect() {
  const loc = useLocation();
  const date = loc.pathname.split("/").pop();
  return <Navigate to={`/app/day/${date}`} replace />;
}
