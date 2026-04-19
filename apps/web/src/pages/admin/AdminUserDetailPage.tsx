import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { adminApi } from "@/lib/adminApi";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

interface UserDetail {
  user: {
    id: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
    createdAt: string;
    avatarUrl?: string | null;
    avatarLibraryId?: string | null;
    entryCount: number;
    audioCount: number;
    videoCount: number;
    textCount: number;
    storageBytes: number;
    currentStreak: number;
    byMonth: { month: string; count: number }[];
  };
  warnings: {
    id: string;
    message: string;
    level: "info" | "warning" | "danger";
    isDismissed: boolean;
    createdAt: string;
  }[];
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export default function AdminUserDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", id],
    queryFn: async () => (await adminApi.get<UserDetail>(`/api/admin/users/${id}`)).data,
    enabled: !!id,
  });

  const [warnLevel, setWarnLevel] = useState<"info" | "warning" | "danger">("info");
  const [warnMessage, setWarnMessage] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const addWarning = useMutation({
    mutationFn: async () => {
      await adminApi.post(`/api/admin/users/${id}/warnings`, {
        message: warnMessage,
        level: warnLevel,
      });
    },
    onSuccess: () => {
      setWarnMessage("");
      qc.invalidateQueries({ queryKey: ["admin", "user", id] });
      toast.success("Warning added");
    },
    onError: (err) => toast.error("Couldn't add warning", apiErrorMessage(err)),
  });

  const removeWarning = useMutation({
    mutationFn: async (wid: string) => {
      await adminApi.delete(`/api/admin/warnings/${wid}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "user", id] }),
  });

  const deleteUser = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/users/${id}`, { data: { confirmEmail } });
    },
    onSuccess: () => {
      toast.success("Account deleted");
      navigate("/admin/users", { replace: true });
    },
    onError: (err) => toast.error("Couldn't delete user", apiErrorMessage(err)),
  });

  const toggleVerified = useMutation({
    mutationFn: async (next: boolean) => {
      await adminApi.patch(`/api/admin/users/${id}/verify`, { emailVerified: next });
    },
    onSuccess: (_d, next) => {
      qc.invalidateQueries({ queryKey: ["admin", "user", id] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      toast.success(next ? "User verified" : "Verification revoked");
    },
    onError: (err) => toast.error("Couldn't update verification", apiErrorMessage(err)),
  });

  if (isLoading || !data) {
    return (
      <div>
        <Link to="/admin/users" className="admin-back-link">
          <ArrowLeft className="h-3.5 w-3.5" /> Users
        </Link>
        <p className="admin-page-subtitle" style={{ marginTop: 16 }}>
          Loading…
        </p>
      </div>
    );
  }

  const { user, warnings } = data;
  const canDelete = confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <div>
      <Link to="/admin/users" className="admin-back-link">
        <ArrowLeft className="h-3.5 w-3.5" /> Users
      </Link>

      <div className="admin-detail-header">
        <div>
          <h1 className="admin-page-title">{user.displayName}</h1>
          <p className="admin-page-subtitle">{user.email}</p>
        </div>
        <div className="admin-verify-control">
          {user.emailVerified ? (
            <span className="admin-pill admin-pill--success">Verified</span>
          ) : (
            <span className="admin-pill admin-pill--warning">Pending verification</span>
          )}
          <label className="admin-toggle" title="Manually mark as verified">
            <input
              type="checkbox"
              checked={user.emailVerified}
              disabled={toggleVerified.isPending}
              onChange={(e) => toggleVerified.mutate(e.target.checked)}
            />
            <span className="admin-toggle-track">
              <span className="admin-toggle-thumb" />
            </span>
            <span className="admin-toggle-label">Email verified</span>
          </label>
        </div>
      </div>

      <div className="admin-stats-grid">
        <DetailStat label="Entries" value={user.entryCount} />
        <DetailStat label="Audio" value={user.audioCount} />
        <DetailStat label="Video" value={user.videoCount} />
        <DetailStat label="Text" value={user.textCount} />
        <DetailStat label="Storage" value={formatBytes(user.storageBytes)} />
        <DetailStat label="Current streak" value={`${user.currentStreak} d`} />
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">Entries by month</h2>
        <div className="admin-chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={user.byMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border-default)" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Warnings</h2>
        {warnings.length === 0 ? (
          <p className="admin-empty">No warnings.</p>
        ) : (
          <ul className="admin-warning-list">
            {warnings.map((w) => (
              <li key={w.id} className={`admin-warning-row admin-warning-row--${w.level}`}>
                <div>
                  <span className={`admin-pill admin-pill--${w.level}`}>{w.level}</span>
                  <p className="admin-warning-msg">{w.message}</p>
                  <p className="admin-warning-meta">
                    {new Date(w.createdAt).toLocaleString()}
                    {w.isDismissed ? " · dismissed by user" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-row-link admin-row-link--danger"
                  onClick={() => removeWarning.mutate(w.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="admin-warning-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (warnMessage.trim().length < 2) return;
            addWarning.mutate();
          }}
        >
          <div className="admin-warning-form-row">
            <select
              className="settings-select"
              value={warnLevel}
              onChange={(e) =>
                setWarnLevel(e.target.value as "info" | "warning" | "danger")
              }
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
          </div>
          <Textarea
            placeholder="Message shown to the user at the top of their app…"
            value={warnMessage}
            onChange={(e) => setWarnMessage(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={addWarning.isPending || !warnMessage.trim()}>
            Add warning
          </Button>
        </form>
      </section>

      <section className="admin-section admin-section--danger">
        <h2 className="admin-section-title">Danger zone</h2>
        {!showDelete ? (
          <Button
            variant="destructive"
            onClick={() => setShowDelete(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </Button>
        ) : (
          <div className="admin-danger-confirm">
            <p className="admin-empty" style={{ marginBottom: 12 }}>
              Type the user's email <strong>{user.email}</strong> to confirm permanent deletion.
            </p>
            <div className="space-y-1.5" style={{ marginBottom: 12 }}>
              <Label htmlFor="confirmEmail">Email</Label>
              <Input
                id="confirmEmail"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!canDelete || deleteUser.isPending}
                onClick={() => deleteUser.mutate()}
              >
                Delete account permanently
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-stat-card">
      <div>
        <div className="admin-stat-value">{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}
