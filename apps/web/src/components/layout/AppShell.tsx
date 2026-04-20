import {
  BarChart3,
  CalendarDays,
  LogOut,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { TopBanners } from "@/components/layout/TopBanners";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTrashCount } from "@/hooks/useTrash";
import { useAuthStore } from "@/store/authStore";

const MAIN_NAV = [
  { to: "/app/calendar", label: "My Journal", icon: CalendarDays },
  { to: "/app/stats", label: "Stats", icon: BarChart3 },
  { to: "/app/trash", label: "Trash", icon: Trash2 },
];

const SETTINGS_NAV = [{ to: "/app/settings", label: "Settings", icon: SettingsIcon }];

const navItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.2 },
  }),
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const trashCount = useTrashCount();

  async function onLogout() {
    await logout();
    toast.info("Signed out");
    navigate("/auth", { replace: true });
  }

  return (
    <div className="app-shell min-h-screen bg-app flex flex-col">
      <TopBanners />
      <div className="flex flex-1 min-h-0">
      <aside className="sidebar hidden md:flex fixed left-0 top-[var(--top-banners-height,0px)] bottom-0 w-[240px] flex-col border-r border-border-default bg-surface z-40 py-5">
        <Link
          to="/"
          className="sidebar-logo-link mx-3 border-b border-border-subtle pb-4"
          aria-label="Luminary home"
          title="Back to landing"
        >
          <LogoMark />
          <div>
            <div className="text-md font-semibold leading-none text-primary">Luminary</div>
            <div className="text-xs font-mono text-tertiary mt-1">v0.1.0</div>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 pt-3">
          {MAIN_NAV.map((item, i) => (
            <motion.div
              key={item.to}
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="show"
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "nav-item relative flex h-10 items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors",
                    isActive ? "is-active" : "hover:bg-hover",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-accent" />
                    )}
                    <item.icon
                      className={cn(
                        "h-[15px] w-[15px]",
                        isActive ? "text-primary" : "text-secondary",
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    <span className="nav-label flex-1 text-left">{item.label}</span>
                    {item.to === "/app/trash" && trashCount > 0 && (
                      <span className="nav-item-count">{trashCount}</span>
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}

          <div className="my-2 border-t border-border-subtle" />

          {SETTINGS_NAV.map((item, i) => (
            <motion.div
              key={item.to}
              custom={MAIN_NAV.length + i}
              variants={navItemVariants}
              initial="hidden"
              animate="show"
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "nav-item relative flex h-10 items-center gap-2.5 rounded-md px-3 text-[13px] transition-colors",
                    isActive ? "is-active" : "hover:bg-hover",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-accent" />
                    )}
                    <item.icon
                      className={cn(
                        "h-[15px] w-[15px]",
                        isActive ? "text-primary" : "text-secondary",
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    <span className="nav-label">{item.label}</span>
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col px-3">
          <button
            type="button"
            className="sidebar-profile-btn"
            onClick={() => navigate("/app/settings?tab=profile")}
            title="Profile settings"
          >
            <UserAvatar
              user={{
                displayName: user?.displayName ?? "?",
                avatarUrl: user?.avatarUrl,
                avatarLibraryId: user?.avatarLibraryId,
              }}
              size={32}
            />
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">
                {user?.displayName ?? "Journaler"}
              </span>
              <span className="sidebar-profile-email">{user?.email}</span>
            </div>
            <SettingsIcon className="sidebar-profile-arrow h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm text-secondary hover:bg-hover hover:text-primary transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-[240px]">
        {children}
      </main>
      </div>

      <nav className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 flex min-h-[56px] items-stretch border-t border-border-default bg-elevated pb-[env(safe-area-inset-bottom,0px)]">
        {[...MAIN_NAV, ...SETTINGS_NAV].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "bottom-nav-item relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-200 ease-out",
                isActive ? "is-active text-accent" : "text-secondary hover:text-primary",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-active-indicator"
                    className="bottom-nav-active-indicator"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
                <span>{item.label}</span>
                {item.to === "/app/trash" && trashCount > 0 && (
                  <span className="absolute right-2 top-1 text-[10px] font-mono text-tertiary">
                    {trashCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <FeedbackButton />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <circle cx="12" cy="12" r="8" opacity="0.5" />
      </svg>
    </div>
  );
}
