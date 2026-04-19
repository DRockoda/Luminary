import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { HotToaster } from "@/components/ui/hot-toaster";
import { applyColorTheme } from "@/lib/theme";
import AdminAnnouncementsPage from "@/pages/admin/AdminAnnouncementsPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminFeedbackPage from "@/pages/admin/AdminFeedbackPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AuthPage from "@/pages/AuthPage";
import CalendarPage from "@/pages/CalendarPage";
import DayPage from "@/pages/DayPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import LandingPage from "@/pages/LandingPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SettingsPage from "@/pages/SettingsPage";
import StatsPage from "@/pages/StatsPage";
import TrashPage from "@/pages/TrashPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import { useAuthStore } from "@/store/authStore";

function ProtectedLayout() {
  const location = useLocation();
  return (
    <AuthGuard>
      <AppShell>
        <div key={location.pathname} className="min-h-full">
          <Outlet />
        </div>
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
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (user?.theme) applyColorTheme(user.theme);
  }, [user?.theme]);

  return (
    <>
      <Routes>
        {/* Public marketing site */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* Admin (hidden) */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
        </Route>

        {/* Protected app */}
        <Route element={<ProtectedLayout />}>
          <Route path="/app" element={<Navigate to="/app/calendar" replace />} />
          <Route path="/app/calendar" element={<CalendarPage />} />
          <Route path="/app/day/:date" element={<DayPage />} />
          <Route path="/app/stats" element={<StatsPage />} />
          <Route path="/app/trash" element={<TrashPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/calendar" element={<Navigate to="/app/calendar" replace />} />
        <Route path="/stats" element={<Navigate to="/app/stats" replace />} />
        <Route path="/trash" element={<Navigate to="/app/trash" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        <Route path="/day/:date" element={<LegacyDayRedirect />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <HotToaster />
      <InstallPrompt />
    </>
  );
}

function LegacyDayRedirect() {
  const location = useLocation();
  const date = location.pathname.split("/").pop();
  return <Navigate to={`/app/day/${date}`} replace />;
}
