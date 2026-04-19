import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { api, apiErrorMessage } from "@/lib/api";
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
  currentStreak: number;
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
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: async () =>
      (
        await api.get<{ users: AdminUserRow[] }>("/api/admin/users", {
          params: q ? { q } : {},
        })
      ).data.users,
  });

  const toggleVerified = useMutation({
    mutationFn: async (vars: { id: string; next: boolean }) => {
      await api.patch(`/api/admin/users/${vars.id}/verify`, {
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
              <th>Streak</th>
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
                  No users found.
                </td>
              </tr>
            )}
            {(data ?? []).map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user-name">{u.displayName}</span>
                    <span className="admin-user-email">{u.email}</span>
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
                  <div>{u.entryCount}</div>
                  <div className="admin-row-sub">
                    {u.audioCount}a · {u.videoCount}v · {u.textCount}t
                  </div>
                </td>
                <td>{formatBytes(u.storageBytes)}</td>
                <td>{u.currentStreak} d</td>
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
