import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { adminApi } from "@/lib/adminApi";
import { apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";

type Color = "info" | "success" | "warning" | "danger" | "accent";

interface Announcement {
  id: string;
  message: string;
  link: string | null;
  linkLabel: string | null;
  color: Color;
  isActive: boolean;
  isMaintenance: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export default function AdminAnnouncementsPage() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [color, setColor] = useState<Color>("info");
  const [expiresAt, setExpiresAt] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () =>
      (await adminApi.get<{ announcements: Announcement[] }>("/api/admin/announcements")).data
        .announcements,
  });

  const isMaintenanceActive = useMemo(
    () => (data ?? []).some((a) => a.isMaintenance && a.isActive),
    [data],
  );

  const enableMaintenance = useMutation({
    mutationFn: async () => {
      await adminApi.patch("/api/admin/announcements/deactivate-all");
      await adminApi.post("/api/admin/announcements", {
        message: "We are currently performing maintenance. We will be back shortly.",
        color: "warning",
        isMaintenance: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", "active"] });
      toast.success("Maintenance mode enabled");
    },
    onError: (err) => toast.error("Couldn't enable maintenance", apiErrorMessage(err)),
  });

  const disableMaintenance = useMutation({
    mutationFn: async () => {
      await adminApi.patch("/api/admin/announcements/disable-maintenance");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", "active"] });
      toast.success("Maintenance mode disabled");
    },
    onError: (err) => toast.error("Couldn't disable maintenance", apiErrorMessage(err)),
  });

  const create = useMutation({
    mutationFn: async () => {
      const expiresIso = expiresAt
        ? new Date(expiresAt).toISOString()
        : "";
      await adminApi.post("/api/admin/announcements", {
        message,
        link: link || undefined,
        linkLabel: linkLabel || undefined,
        color,
        expiresAt: expiresIso || undefined,
      });
    },
    onSuccess: () => {
      setMessage("");
      setLink("");
      setLinkLabel("");
      setExpiresAt("");
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", "active"] });
      toast.success("Announcement published");
    },
    onError: (err) => toast.error("Couldn't publish", apiErrorMessage(err)),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.patch(`/api/admin/announcements/${id}`, { isActive });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", "active"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      qc.invalidateQueries({ queryKey: ["announcement", "active"] });
    },
  });

  return (
    <div>
      <h1 className="admin-page-title">Announcements</h1>
      <p className="admin-page-subtitle">
        Show a banner at the top of every user's app. Only one is active at a time.
      </p>

      <div className="admin-maintenance-card">
        <div className="admin-maintenance-header">
          <div>
            <h3>Maintenance mode</h3>
            <p>
              Show a maintenance page to all users. They cannot access the journal app while this
              is enabled. Use the admin console (this site) to turn it off.
            </p>
          </div>
          <div className="admin-maintenance-toggle-wrapper">
            {isMaintenanceActive ? (
              <Button
                type="button"
                variant="destructive"
                disabled={disableMaintenance.isPending}
                onClick={() => disableMaintenance.mutate()}
              >
                Disable maintenance mode
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={enableMaintenance.isPending}
                onClick={() => enableMaintenance.mutate()}
              >
                Enable maintenance mode
              </Button>
            )}
          </div>
        </div>
        {isMaintenanceActive && (
          <div className="admin-maintenance-active-notice">
            Maintenance mode is active. All users see the maintenance screen until you disable it
            here.
          </div>
        )}
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">New announcement</h2>
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!message.trim()) return;
            create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="We're rolling out a new feature this weekend…"
              rows={3}
            />
          </div>
          <div className="admin-form-row">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <select
                className="settings-select admin-select"
                value={color}
                onChange={(e) => setColor(e.target.value as Color)}
              >
                <option value="info">Info (blue)</option>
                <option value="success">Success (green)</option>
                <option value="warning">Warning (amber)</option>
                <option value="danger">Danger (red)</option>
                <option value="accent">Accent (theme color)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Expires at (optional)</Label>
              <input
                type="datetime-local"
                className="settings-time-input admin-datetime"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="space-y-1.5">
              <Label>Link (optional)</Label>
              <Input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link label (optional)</Label>
              <Input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Learn more"
              />
            </div>
          </div>
          <Button type="submit" disabled={create.isPending || !message.trim()}>
            Publish announcement
          </Button>
        </form>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">All announcements</h2>
        {isLoading && <p className="admin-empty">Loading…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="admin-empty">No announcements yet.</p>
        )}
        <ul className="admin-announce-list">
          {(data ?? []).map((a) => (
            <li
              key={a.id}
              className={`admin-announce-row admin-announce-row--${a.color}${
                a.isActive ? " is-active" : ""
              }`}
            >
              <div>
                <div className="admin-announce-meta">
                  <span className={`admin-pill admin-pill--${a.color}`}>{a.color}</span>
                  {a.isMaintenance && (
                    <span className="admin-pill admin-pill--warning">Maintenance</span>
                  )}
                  {a.isActive && (
                    <span className="admin-pill admin-pill--success">Active</span>
                  )}
                  <span className="admin-row-sub">
                    {new Date(a.createdAt).toLocaleString()}
                    {a.expiresAt
                      ? ` · expires ${new Date(a.expiresAt).toLocaleDateString()}`
                      : ""}
                  </span>
                </div>
                <p className="admin-announce-msg">{a.message}</p>
                {a.link && (
                  <a className="admin-row-link" href={a.link} target="_blank" rel="noreferrer">
                    {a.linkLabel || a.link}
                  </a>
                )}
              </div>
              <div className="admin-announce-actions">
                <button
                  type="button"
                  className="admin-row-link"
                  onClick={() => toggle.mutate({ id: a.id, isActive: !a.isActive })}
                >
                  {a.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  className="admin-row-link admin-row-link--danger"
                  onClick={() => remove.mutate(a.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
