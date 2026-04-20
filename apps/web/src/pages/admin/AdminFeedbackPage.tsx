import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, User, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/adminApi";

interface FeedbackItem {
  id: string;
  title: string;
  message: string;
  type: "feedback" | "bug" | "feature" | "question";
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  name: string | null;
  email: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<FeedbackItem["type"], string> = {
  feedback: "💬",
  bug: "🐛",
  feature: "✨",
  question: "❓",
};
const PRIORITY_ICONS: Record<FeedbackItem["priority"], string> = {
  low: "🟢",
  normal: "🔵",
  high: "🟡",
  urgent: "🔴",
};

export default function AdminFeedbackPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<FeedbackItem | null>(null);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback", q],
    queryFn: async () =>
      (
        await adminApi.get<{ feedback: FeedbackItem[] }>("/api/admin/feedback", {
          params: q ? { q } : {},
        })
      ).data.feedback,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FeedbackItem["status"] }) => {
      await adminApi.patch(`/api/admin/feedback/${id}`, { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "feedback"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/feedback/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "feedback"] });
      setOpen(null);
    },
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Feedback</h1>
          <p className="admin-page-subtitle">
            User-linked feedback and anonymous submissions.
          </p>
        </div>
        <div className="admin-search">
          <Search className="h-3.5 w-3.5 text-tertiary" strokeWidth={2} />
          <Input
            placeholder="Search by user, email, title, or message…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="admin-feedback-list">
          {isLoading && <p className="admin-table-empty">Loading…</p>}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="admin-table-empty">No feedback yet.</p>
          )}
          {(data ?? []).map((item) => (
            <div
              key={item.id}
              className={`admin-feedback-card priority-${item.priority}`}
              onClick={() => setOpen(item)}
            >
              <div className="admin-feedback-card-header">
                <div className="admin-feedback-badges">
                  <span className={`admin-badge admin-badge-type-${item.type}`}>
                    {TYPE_ICONS[item.type]} {item.type}
                  </span>
                  <span className={`admin-badge admin-badge-priority-${item.priority}`}>
                    {PRIORITY_ICONS[item.priority]} {item.priority}
                  </span>
                </div>
                <div className="admin-feedback-meta">
                  {item.user ? (
                    <span className="admin-feedback-user">
                      <User size={11} />
                      {item.user.displayName}
                      <span className="admin-feedback-user-email">({item.user.email})</span>
                    </span>
                  ) : (
                    <span className="admin-feedback-user admin-cell-muted">
                      {item.name || "Anonymous"} {item.email ? `(${item.email})` : ""}
                    </span>
                  )}
                  <span className="admin-feedback-date">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <h4 className="admin-feedback-title">{item.title}</h4>
              <p className="admin-feedback-message">{item.message}</p>

              <div className="admin-feedback-card-footer" onClick={(e) => e.stopPropagation()}>
                <select
                  className="admin-status-select"
                  value={item.status}
                  onChange={(e) =>
                    updateStatus.mutate({
                      id: item.id,
                      status: e.target.value as FeedbackItem["status"],
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="admin-modal-overlay" onClick={() => setOpen(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <p className="admin-user-name">{open.user?.displayName || open.name || "Anonymous"}</p>
                <p className="admin-user-email">{open.user?.email || open.email || "No email"}</p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setOpen(null)}
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <h4 className="admin-feedback-title" style={{ padding: "0 20px", marginTop: "16px" }}>
              {open.title}
            </h4>
            <p className="admin-modal-body">{open.message}</p>
            <div className="admin-modal-footer">
              <p className="admin-row-sub">
                {new Date(open.createdAt).toLocaleString()}
              </p>
              <div className="flex gap-2">
                <select
                  className="admin-status-select"
                  value={open.status}
                  onChange={(e) =>
                    updateStatus.mutate({
                      id: open.id,
                      status: e.target.value as FeedbackItem["status"],
                    })
                  }
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  type="button"
                  className="admin-row-link admin-row-link--danger"
                  onClick={() => remove.mutate(open.id)}
                >
                  <Trash2 className="h-3 w-3 inline" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
