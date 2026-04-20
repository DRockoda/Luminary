import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, ArrowLeft, Check, Copy, ShieldCheck, Trash2, X } from "lucide-react";
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

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
  const activeWarnings = warnings.filter((w) => !w.isDismissed);
  const canDelete = confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  async function handleCopyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = email;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    }
  }

  return (
    <div>
      <Link to="/admin/users" className="admin-back-link">
        <ArrowLeft className="h-3.5 w-3.5" /> Users
      </Link>

      <div className="admin-detail-header">
        <div>
          <h1 className="admin-page-title">{user.displayName}</h1>
          <div className="admin-user-email-row">
            <span className="admin-user-email admin-user-email--detail">{user.email}</span>
            <button
              type="button"
              className={`admin-copy-btn ${emailCopied ? "is-copied" : ""}`}
              onClick={() => void handleCopyEmail(user.email)}
              title={emailCopied ? "Copied!" : "Copy email"}
              aria-label="Copy email address"
            >
              {emailCopied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            {emailCopied && <span className="admin-copy-toast">Copied!</span>}
          </div>
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

      <section className="admin-section admin-user-warnings-section">
        <div className="admin-section-header admin-warnings-header">
          <h2 className="admin-section-title">
            <AlertCircle size={14} />
            User Warnings
          </h2>
          <span className="admin-section-count">{activeWarnings.length} active</span>
        </div>
        {activeWarnings.length === 0 ? (
          <div className="admin-empty-warnings">
            <ShieldCheck size={20} />
            <span>No active warnings</span>
          </div>
        ) : (
          <div className="admin-warnings-list">
            {activeWarnings.map((w) => (
              <div key={w.id} className={`admin-warning-item admin-warning-${w.level}`}>
                <div className="admin-warning-item-left">
                  <span className={`admin-warning-badge admin-warning-badge-${w.level}`}>
                    {w.level}
                  </span>
                  <p className="admin-warning-message">{w.message}</p>
                </div>
                <button
                  type="button"
                  className="admin-warning-remove-btn"
                  onClick={() => removeWarning.mutate(w.id)}
                  title="Remove warning"
                  aria-label="Remove warning"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          className="admin-add-warning-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (warnMessage.trim().length < 2) return;
            addWarning.mutate();
          }}
        >
          <select
            className="admin-select"
            value={warnLevel}
            onChange={(e) =>
              setWarnLevel(e.target.value as "info" | "warning" | "danger")
            }
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </select>
          <Textarea
            className="admin-textarea"
            placeholder="Message shown to the user at the top of their app…"
            value={warnMessage}
            onChange={(e) => setWarnMessage(e.target.value)}
            rows={3}
          />
          <button
            type="submit"
            className="admin-btn-warning-submit"
            disabled={addWarning.isPending || !warnMessage.trim()}
          >
            Add warning
          </button>
        </form>
      </section>

      <section className="admin-danger-zone">
        <div className="admin-danger-zone-header">
          <div className="admin-danger-zone-icon">
            <AlertTriangle size={16} />
          </div>
          <div>
            <h3 className="admin-danger-zone-title">Danger Zone</h3>
            <p className="admin-danger-zone-desc">
              These actions are permanent and cannot be undone.
            </p>
          </div>
        </div>

        <div className="admin-danger-action-row">
          <div className="admin-danger-action-info">
            <p className="admin-danger-action-title">Delete this account</p>
            <p className="admin-danger-action-desc">
              Permanently deletes the user's account, all journal entries, and removes
              access. Their Google Drive files are not deleted.
            </p>
          </div>
          <button
            type="button"
            className="admin-delete-trigger-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} />
            Delete account
          </button>
        </div>
      </section>

      {showDeleteConfirm && (
        <div
          className="admin-delete-modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
          role="presentation"
        >
          <div className="admin-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-delete-modal-header">
              <div className="admin-delete-modal-icon">
                <Trash2 size={20} />
              </div>
              <h3>Delete account permanently?</h3>
            </div>

            <p className="admin-delete-modal-warning">
              This will permanently delete <strong>{user.displayName}</strong>&apos;s
              account and all their journal entries. This action <strong>cannot be
              undone</strong>.
            </p>

            <div className="admin-delete-confirm-field">
              <Label htmlFor="confirmEmail">
                Type <strong>{user.email}</strong> to confirm:
              </Label>
              <Input
                id="confirmEmail"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user.email}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="admin-delete-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmEmail("");
                }}
                disabled={deleteUser.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-delete"
                disabled={!canDelete || deleteUser.isPending}
                onClick={() => deleteUser.mutate()}
              >
                {deleteUser.isPending ? (
                  <>
                    <span className="admin-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
