import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface FeedbackItem {
  id: string;
  name: string | null;
  email: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<FeedbackItem | null>(null);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback", q],
    queryFn: async () =>
      (
        await api.get<{ feedback: FeedbackItem[] }>("/api/admin/feedback", {
          params: q ? { q } : {},
        })
      ).data.feedback,
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isResolved }: { id: string; isResolved: boolean }) => {
      await api.patch(`/api/admin/feedback/${id}`, { isResolved });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "feedback"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/admin/feedback/${id}`);
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
            All messages submitted from the landing page.
          </p>
        </div>
        <div className="admin-search">
          <Search className="h-3.5 w-3.5 text-tertiary" strokeWidth={2} />
          <Input
            placeholder="Search by name, email, or message…"
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
              <th>From</th>
              <th>Message</th>
              <th>Received</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && (data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No feedback yet.
                </td>
              </tr>
            )}
            {(data ?? []).map((f) => (
              <tr key={f.id} onClick={() => setOpen(f)} className="admin-row-clickable">
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user-name">{f.name || "Anonymous"}</span>
                    <span className="admin-user-email">{f.email}</span>
                  </div>
                </td>
                <td className="admin-message-preview">{f.message}</td>
                <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                <td>
                  {f.isResolved ? (
                    <span className="admin-pill admin-pill--success">Resolved</span>
                  ) : (
                    <span className="admin-pill admin-pill--info">Open</span>
                  )}
                </td>
                <td className="admin-table-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="admin-row-link"
                    onClick={() => toggle.mutate({ id: f.id, isResolved: !f.isResolved })}
                  >
                    {f.isResolved ? "Reopen" : "Resolve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="admin-modal-overlay" onClick={() => setOpen(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <p className="admin-user-name">{open.name || "Anonymous"}</p>
                <p className="admin-user-email">{open.email}</p>
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
            <p className="admin-modal-body">{open.message}</p>
            <div className="admin-modal-footer">
              <p className="admin-row-sub">
                {new Date(open.createdAt).toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="admin-row-link"
                  onClick={() =>
                    toggle.mutate({ id: open.id, isResolved: !open.isResolved })
                  }
                >
                  {open.isResolved ? "Reopen" : "Mark resolved"}
                </button>
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
