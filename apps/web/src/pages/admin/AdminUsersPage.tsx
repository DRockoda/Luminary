import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Cloud,
  CloudOff,
  Copy,
  FileText,
  Mic,
  Search,
  Users,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/adminApi";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  createdAt: string;
  entryCount: number;
  audioCount: number;
  videoCount: number;
  textCount: number;
  storageBytes: number;
  driveConnected: boolean;
  lastLoginAt: string | null;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: async () =>
      (
        await adminApi.get<{ users: AdminUserRow[] }>("/api/admin/users", {
          params: q ? { q } : {},
        })
      ).data.users,
  });

  const toggleVerified = useMutation({
    mutationFn: async (vars: { id: string; next: boolean }) => {
      await adminApi.patch(`/api/admin/users/${vars.id}/verify`, {
        emailVerified: vars.next,
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "user", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success(vars.next ? "User verified" : "Verification revoked");
    },
    onError: (err) => toast.error("Couldn't update verification", apiErrorMessage(err)),
  });

  async function handleCopyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail((curr) => (curr === email ? null : curr)), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = email;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail((curr) => (curr === email ? null : curr)), 2000);
    }
  }

  function formatLastLogin(iso: string | null): string {
    if (!iso) return "Never";
    const d = new Date(iso);
    const now = Date.now();
    const diffMins = Math.floor((now - d.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  if (isError) {
    return (
      <div>
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Users</h1>
            <p className="admin-page-subtitle text-danger">
              Couldn&apos;t load users — the request failed (often a cookie or CORS issue
              between the admin site and API).
            </p>
            <p className="text-tertiary text-sm mt-2">
              {apiErrorMessage(error)}
            </p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying…" : "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">
            Metadata only — entry contents are never visible to admins.
          </p>
        </div>
        <div className="admin-search">
          <Search className="h-3.5 w-3.5 text-tertiary" strokeWidth={2} />
          <Input
            placeholder="Search by email or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Joined</th>
              <th>Verified</th>
              <th>Entries</th>
              <th>Storage</th>
              <th>Last Login</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && (data ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Users className="h-8 w-8 text-tertiary" strokeWidth={1.5} aria-hidden />
                    <p className="font-medium text-primary">
                      {q.trim() ? "No users match your search" : "No users yet"}
                    </p>
                    <p className="text-sm text-tertiary max-w-sm">
                      {q.trim()
                        ? "Try a different email or display name."
                        : "Accounts will appear here after people sign up on the app."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {(data ?? []).map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user-name">{u.displayName}</span>
                    <div className="admin-table-email-cell">
                      <span className="admin-user-email">{u.email}</span>
                      <button
                        type="button"
                        className={`admin-copy-btn admin-copy-btn-sm ${copiedEmail === u.email ? "is-copied" : ""}`}
                        onClick={() => void handleCopyEmail(u.email)}
                        title={copiedEmail === u.email ? "Copied!" : "Copy email"}
                        aria-label="Copy email address"
                      >
                        {copiedEmail === u.email ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  <label
                    className="admin-toggle admin-toggle--inline"
                    title={u.emailVerified ? "Revoke verification" : "Mark as verified"}
                  >
                    <input
                      type="checkbox"
                      checked={u.emailVerified}
                      disabled={toggleVerified.isPending}
                      onChange={(e) =>
                        toggleVerified.mutate({ id: u.id, next: e.target.checked })
                      }
                    />
                    <span className="admin-toggle-track">
                      <span className="admin-toggle-thumb" />
                    </span>
                    <span
                      className={
                        u.emailVerified
                          ? "admin-pill admin-pill--success"
                          : "admin-pill admin-pill--warning"
                      }
                    >
                      {u.emailVerified ? "Verified" : "Pending"}
                    </span>
                  </label>
                </td>
                <td>
                  <div className="admin-entries-cell">
                    <span className="admin-entries-total">{u.entryCount}</span>
                    <div className="admin-entries-breakdown">
                      <span className="admin-entry-format" title="Audio entries">
                        <Mic size={10} />
                        {u.audioCount}
                      </span>
                      <span className="admin-entry-format" title="Video entries">
                        <Video size={10} />
                        {u.videoCount}
                      </span>
                      <span className="admin-entry-format" title="Text entries">
                        <FileText size={10} />
                        {u.textCount}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="admin-storage-cell">
                    {u.driveConnected ? (
                      <Cloud size={11} className="admin-storage-icon is-connected" />
                    ) : (
                      <CloudOff size={11} className="admin-storage-icon" />
                    )}
                    <span className={u.driveConnected ? "" : "admin-cell-muted"}>
                      {formatBytes(u.storageBytes)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="admin-lastlogin-cell" title={u.lastLoginAt ?? "Never"}>
                    <span
                      className={`admin-lastlogin-dot ${
                        u.lastLoginAt
                          ? Date.now() - new Date(u.lastLoginAt).getTime() < 24 * 60 * 60 * 1000
                            ? "is-recent"
                            : Date.now() - new Date(u.lastLoginAt).getTime() < 7 * 24 * 60 * 60 * 1000
                              ? "is-week"
                              : ""
                          : ""
                      }`}
                    />
                    <span className={u.lastLoginAt ? "admin-lastlogin-label" : "admin-cell-empty"}>
                      {formatLastLogin(u.lastLoginAt)}
                    </span>
                  </div>
                </td>
                <td className="admin-table-actions">
                  <Link to={`/admin/users/${u.id}`} className="admin-row-link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
