import {
  BarChart3,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/store/adminStore";

const NAV = [
  { to: "/admin/dashboard", label: "Overview", icon: BarChart3 },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/feedback", label: "Feedback", icon: MessageSquare },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function onLogout() {
    await logout();
    navigate("/admin", { replace: true });
  }

  const initial = (admin?.username ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="admin-theme admin-shell">
      <header className="admin-top-header">
        <button
          type="button"
          className="admin-menu-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-expanded={sidebarOpen}
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        >
          {sidebarOpen ? <X className="h-4 w-4" strokeWidth={2} /> : <Menu className="h-4 w-4" strokeWidth={2} />}
        </button>
        <div className="admin-top-header-brand">
          <span className="admin-top-warn" aria-hidden>
            ADMIN
          </span>
          <span className="admin-top-brand-name">Luminary</span>
        </div>
        <span className="admin-top-header-spacer" aria-hidden />
        <span className="admin-top-header-user" title={admin?.username ?? undefined}>
          {admin?.username ?? "Admin"}
        </span>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="admin-top-logout"
          aria-label="Sign out"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
          <span className="admin-top-logout-label">Sign out</span>
        </button>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-layout">
        <aside className={cn("admin-sidebar", sidebarOpen && "is-open")}>
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-mark">L</div>
            <div className="admin-sidebar-brand-text">
              <div className="admin-sidebar-brand-title">Luminary</div>
              <div className="admin-sidebar-brand-sub">Admin console</div>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn("admin-sidebar-link", isActive && "is-active")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="admin-sidebar-link-bar" />}
                    <item.icon className="h-[15px] w-[15px]" strokeWidth={isActive ? 2 : 1.75} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user">
              <div className="admin-sidebar-avatar">{initial}</div>
              <div className="admin-sidebar-user-info">
                <div className="admin-sidebar-user-name">{admin?.username ?? "Admin"}</div>
                <div className="admin-sidebar-user-role">Administrator</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="admin-sidebar-logout"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        <main className="admin-content">
          <div className="admin-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
