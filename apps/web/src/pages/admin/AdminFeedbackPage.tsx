import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2Icon,
  Trash2Icon,
  ClockIcon,
  RefreshCwIcon,
  UserIcon,
  InboxIcon,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { toast } from "react-hot-toast";

type FeedbackStatus = "open" | "in-progress" | "resolved" | "closed";
type TabKey = "active" | "resolved";

interface FeedbackItem {
  id: string;
  title: string;
  priority: string;
  type: string;
  name: string | null;
  email: string;
  message: string;
  status: FeedbackStatus | "in_progress";
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  low: { emoji: "🟢", label: "Low", color: "#22c55e" },
  normal: { emoji: "🔵", label: "Normal", color: "#3b82f6" },
  high: { emoji: "🟡", label: "High", color: "#f59e0b" },
  urgent: { emoji: "🔴", label: "Urgent", color: "#ef4444" },
};

const TYPE_CONFIG: Record<string, { emoji: string; label: string }> = {
  feedback: { emoji: "💬", label: "Feedback" },
  bug: { emoji: "🐛", label: "Bug" },
  feature: { emoji: "✨", label: "Feature" },
  question: { emoji: "❓", label: "Question" },
  other: { emoji: "📝", label: "Other" },
};

const STATUS_OPTIONS: Array<{ value: FeedbackStatus; label: string }> = [
  { value: "open", label: "🔵 Open" },
  { value: "in-progress", label: "🟡 In Progress" },
  { value: "resolved", label: "✅ Resolved" },
  { value: "closed", label: "⚫ Closed" },
];

const normalizeStatus = (status: FeedbackItem["status"]): FeedbackStatus =>
  status === "in_progress" ? "in-progress" : status;

export default function AdminFeedbackPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [counts, setCounts] = useState({ active: 0, resolved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedback = useCallback(async (tab: TabKey) => {
    setIsLoading(true);
    try {
      const res = await adminApi.get<{ feedbacks: FeedbackItem[]; counts: { active: number; resolved: number } }>(
        `/api/admin/feedback?tab=${tab}`
      );
      setFeedbacks(res.data.feedbacks);
      setCounts(res.data.counts);
    } catch {
      toast.error("Failed to load feedback.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFeedback(activeTab);
  }, [activeTab, fetchFeedback]);

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      await adminApi.patch(`/api/admin/feedback/${id}/status`, { status: newStatus });

      if (activeTab === "active" && (newStatus === "resolved" || newStatus === "closed")) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        setCounts((prev) => ({
          active: Math.max(0, prev.active - 1),
          resolved: prev.resolved + 1,
        }));
        toast.success("Marked as resolved.");
      } else if (activeTab === "resolved" && (newStatus === "open" || newStatus === "in-progress")) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        setCounts((prev) => ({
          active: prev.active + 1,
          resolved: Math.max(0, prev.resolved - 1),
        }));
        toast.success("Moved back to active.");
      } else {
        setFeedbacks((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: newStatus,
                }
              : f
          )
        );
        toast.success("Status updated.");
      }
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/api/admin/feedback/${id}`);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      setCounts((prev) => ({
        ...prev,
        resolved: Math.max(0, prev.resolved - 1),
      }));
      toast.success("Feedback deleted.");
    } catch {
      toast.error("Failed to delete feedback.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 2) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="admin-feedback-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Feedback</h1>
          <p className="admin-page-sub">
            User-submitted feedback, bug reports, and feature requests.
          </p>
        </div>
        <button
          className="admin-refresh-btn"
          onClick={() => void fetchFeedback(activeTab)}
          disabled={isLoading}
          title="Refresh"
        >
          <RefreshCwIcon size={14} className={isLoading ? "spinning" : ""} />
          Refresh
        </button>
      </div>

      <div className="admin-feedback-tabs">
        <button
          className={`admin-feedback-tab ${activeTab === "active" ? "is-active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <ClockIcon size={13} />
          Active
          {counts.active > 0 && <span className="admin-tab-badge admin-tab-badge-active">{counts.active}</span>}
        </button>
        <button
          className={`admin-feedback-tab ${activeTab === "resolved" ? "is-active" : ""}`}
          onClick={() => setActiveTab("resolved")}
        >
          <CheckCircle2Icon size={13} />
          Resolved
          {counts.resolved > 0 && (
            <span className="admin-tab-badge admin-tab-badge-resolved">{counts.resolved}</span>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="admin-feedback-loading">
          <div className="admin-spinner-lg" />
          <p>Loading feedback...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="admin-feedback-empty">
          <InboxIcon size={32} />
          <p>{activeTab === "active" ? "No active feedback. All caught up! 🎉" : "No resolved feedback yet."}</p>
        </div>
      ) : (
        <div className="admin-feedback-list">
          {feedbacks.map((fb) => {
            const priority = PRIORITY_CONFIG[fb.priority] || PRIORITY_CONFIG.normal;
            const type = TYPE_CONFIG[fb.type] || TYPE_CONFIG.feedback;
            const status = normalizeStatus(fb.status);

            return (
              <div key={fb.id} className={`admin-feedback-card ${activeTab === "resolved" ? "is-resolved" : ""}`}>
                <div className="admin-feedback-card-header">
                  <div className="admin-feedback-badges">
                    <span className="admin-feedback-type-badge">
                      {type.emoji} {type.label}
                    </span>
                    <span
                      className="admin-feedback-priority-badge"
                      style={{
                        color: priority.color,
                        borderColor: `${priority.color}40`,
                        background: `${priority.color}10`,
                      }}
                    >
                      {priority.emoji} {priority.label}
                    </span>
                    <span className={`admin-feedback-status-badge status-${status}`}>
                      {status === "open"
                        ? "🔵 Open"
                        : status === "in-progress"
                          ? "🟡 In Progress"
                          : status === "resolved"
                            ? "✅ Resolved"
                            : "⚫ Closed"}
                    </span>
                  </div>
                  <span className="admin-feedback-date">{formatDate(fb.createdAt)}</span>
                </div>

                <h3 className="admin-feedback-title">{fb.title}</h3>
                <p className="admin-feedback-message">{fb.message}</p>

                <div className="admin-feedback-user-row">
                  <UserIcon size={12} />
                  <span>
                    <strong>{fb.name || "Anonymous"}</strong>
                    <span className="admin-feedback-user-email"> · {fb.email}</span>
                  </span>
                </div>

                <div className="admin-feedback-actions">
                  <div className="admin-feedback-status-select-wrapper">
                    <select
                      className="admin-feedback-status-select"
                      value={status}
                      onChange={(e) => void handleStatusChange(fb.id, e.target.value as FeedbackStatus)}
                      disabled={updatingId === fb.id}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeTab === "active" && (
                    <button
                      className="admin-feedback-resolve-btn"
                      onClick={() => void handleStatusChange(fb.id, "resolved")}
                      disabled={updatingId === fb.id}
                      title="Mark as resolved"
                    >
                      {updatingId === fb.id ? <span className="admin-spinner-sm" /> : <CheckCircle2Icon size={14} />}
                      Resolve
                    </button>
                  )}

                  {activeTab === "resolved" && (
                    <button
                      className="admin-feedback-reopen-btn"
                      onClick={() => void handleStatusChange(fb.id, "open")}
                      disabled={updatingId === fb.id}
                      title="Reopen feedback"
                    >
                      <RefreshCwIcon size={13} />
                      Reopen
                    </button>
                  )}

                  {activeTab === "resolved" && (
                    <button
                      className="admin-feedback-delete-btn"
                      onClick={() => void handleDelete(fb.id, fb.title)}
                      disabled={deletingId === fb.id}
                      title="Delete permanently"
                    >
                      {deletingId === fb.id ? <span className="admin-spinner-sm" /> : <Trash2Icon size={13} />}
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
