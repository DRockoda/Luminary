import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi } from "@/lib/adminApi";
import { useAdminStore } from "@/store/adminStore";

interface RecentSignup {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
}
interface RecentFeedback {
  id: string;
  name: string | null;
  email: string;
  isResolved: boolean;
  createdAt: string;
}
interface Overview {
  totalUsers: number;
  verifiedUsers: number;
  pendingUsers: number;
  totalEntries: number;
  unresolvedFeedback: number;
  signupsToday: number;
  entriesToday: number;
  activeWeek: number;
  signups: { date: string; count: number }[];
  latestSignups: RecentSignup[];
  latestFeedback: RecentFeedback[];
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminDashboardPage() {
  const admin = useAdminStore((s) => s.admin);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => (await adminApi.get<Overview>("/api/admin/stats/overview")).data,
  });

  const verifiedPct =
    data && data.totalUsers > 0
      ? Math.round((data.verifiedUsers / data.totalUsers) * 100)
      : 0;

  return (
    <div>
      {/* Welcome hero */}
      <div className="admin-hero">
        <div className="admin-hero-content">
          <div className="admin-hero-eyebrow">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Admin console</span>
          </div>
          <h1 className="admin-hero-title">
            Welcome back, {admin?.username ?? "Admin"}
          </h1>
          <p className="admin-hero-sub">
            Here&apos;s what&apos;s happening across Luminary today.
          </p>
        </div>
        <div className="admin-hero-quick">
          <QuickStat
            icon={<UserPlus className="h-3.5 w-3.5" strokeWidth={2} />}
            label="Signups today"
            value={data?.signupsToday ?? 0}
          />
          <QuickStat
            icon={<FileText className="h-3.5 w-3.5" strokeWidth={2} />}
            label="Entries today"
            value={data?.entriesToday ?? 0}
          />
          <QuickStat
            icon={<Activity className="h-3.5 w-3.5" strokeWidth={2} />}
            label="Active this week"
            value={data?.activeWeek ?? 0}
          />
        </div>
      </div>

      {/* Headline stat cards */}
      <div className="admin-stats-grid">
        <BigStat
          icon={<Users className="h-4 w-4" strokeWidth={2} />}
          label="Total users"
          value={data?.totalUsers ?? 0}
          loading={isLoading}
          tone="primary"
          subtitle={
            data
              ? `${data.verifiedUsers} verified · ${data.pendingUsers} pending`
              : undefined
          }
        />
        <BigStat
          icon={<CheckCircle2 className="h-4 w-4" strokeWidth={2} />}
          label="Verification rate"
          value={`${verifiedPct}%`}
          loading={isLoading}
          tone="success"
          subtitle={
            data
              ? `${data.verifiedUsers}/${data.totalUsers} verified`
              : undefined
          }
        />
        <BigStat
          icon={<FileText className="h-4 w-4" strokeWidth={2} />}
          label="Total entries"
          value={data?.totalEntries ?? 0}
          loading={isLoading}
          tone="neutral"
        />
        <BigStat
          icon={<MessageSquare className="h-4 w-4" strokeWidth={2} />}
          label="Unresolved feedback"
          value={data?.unresolvedFeedback ?? 0}
          loading={isLoading}
          tone={(data?.unresolvedFeedback ?? 0) > 0 ? "warning" : "neutral"}
          link={{ to: "/admin/feedback", label: "Review" }}
        />
      </div>

      {/* Signups chart */}
      <section className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">
            <TrendingUp className="h-3.5 w-3.5 inline mr-1.5" strokeWidth={2} />
            New signups · last 30 days
          </h2>
        </div>
        <div className="admin-chart-wrap">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={data?.signups ?? []}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border-default)" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#signupFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent activity */}
      <div className="admin-grid-2">
        <section className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">
              <UserPlus className="h-3.5 w-3.5 inline mr-1.5" strokeWidth={2} />
              Recent signups
            </h2>
            <Link to="/admin/users" className="admin-section-link">
              View all
            </Link>
          </div>
          {(data?.latestSignups ?? []).length === 0 ? (
            <p className="admin-empty">No signups yet.</p>
          ) : (
            <ul className="admin-activity-list">
              {(data?.latestSignups ?? []).map((u) => (
                <li key={u.id} className="admin-activity-row">
                  <div className="admin-activity-avatar">
                    {u.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="admin-activity-body">
                    <div className="admin-activity-name">{u.displayName}</div>
                    <div className="admin-activity-meta">{u.email}</div>
                  </div>
                  <div className="admin-activity-side">
                    {u.emailVerified ? (
                      <span className="admin-pill admin-pill--success">Verified</span>
                    ) : (
                      <span className="admin-pill admin-pill--warning">Pending</span>
                    )}
                    <span className="admin-activity-time">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {relativeTime(u.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">
              <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" strokeWidth={2} />
              Recent feedback
            </h2>
            <Link to="/admin/feedback" className="admin-section-link">
              View all
            </Link>
          </div>
          {(data?.latestFeedback ?? []).length === 0 ? (
            <p className="admin-empty">No feedback yet.</p>
          ) : (
            <ul className="admin-activity-list">
              {(data?.latestFeedback ?? []).map((f) => (
                <li key={f.id} className="admin-activity-row">
                  <div className="admin-activity-avatar admin-activity-avatar--feedback">
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <div className="admin-activity-body">
                    <div className="admin-activity-name">
                      {f.name || "Anonymous"}
                    </div>
                    <div className="admin-activity-meta">{f.email}</div>
                  </div>
                  <div className="admin-activity-side">
                    {f.isResolved ? (
                      <span className="admin-pill admin-pill--success">Resolved</span>
                    ) : (
                      <span className="admin-pill admin-pill--info">Open</span>
                    )}
                    <span className="admin-activity-time">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {relativeTime(f.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="admin-quick-stat">
      <div className="admin-quick-stat-icon">{icon}</div>
      <div>
        <div className="admin-quick-stat-value">{value}</div>
        <div className="admin-quick-stat-label">{label}</div>
      </div>
    </div>
  );
}

function BigStat({
  icon,
  label,
  value,
  loading,
  tone = "neutral",
  subtitle,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading?: boolean;
  tone?: "neutral" | "primary" | "success" | "warning";
  subtitle?: string;
  link?: { to: string; label: string };
}) {
  return (
    <div className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-body">
        <div className="admin-stat-value">
          {loading ? "—" : typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="admin-stat-label">{label}</div>
        {subtitle && <div className="admin-stat-sub">{subtitle}</div>}
        {link && (
          <Link to={link.to} className="admin-stat-link">
            {link.label} →
          </Link>
        )}
      </div>
    </div>
  );
}
