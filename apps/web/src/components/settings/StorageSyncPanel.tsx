import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, Cloud } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useDrive, type DriveStatus } from "@/hooks/useDrive";
import { useAuthStore } from "@/store/authStore";

interface StorageEstimate {
  textCount: number;
  textBytes: number;
  audioCount: number;
  audioBytes: number;
  videoCount: number;
  videoBytes: number;
  totalCount: number;
  totalBytes: number;
}

const FREE_DRIVE_BYTES = 15 * 1024 * 1024 * 1024;

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

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function StorageSyncPanel() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const {
    status,
    statusLoading,
    isStatusError,
    statusError,
    refetchStatus,
    storageBytes,
    storageLoading,
    refetchDrive,
    connect,
    connectPending,
    connectDisabled,
    disconnect,
    disconnectPending,
    syncNow,
    syncPending,
    updateSyncMode,
  } = useDrive();

  const { data: estimate } = useQuery<StorageEstimate>({
    queryKey: ["export", "estimate"],
    queryFn: async () =>
      (await api.get<StorageEstimate>("/api/export/estimate")).data,
  });

  // React to OAuth callback `?drive=connected|error`
  useEffect(() => {
    const driveParam = searchParams.get("drive");
    if (!driveParam) return;
    if (driveParam === "connected") {
      toast.success("Google Drive connected");
      refetchDrive();
      // Refresh user profile so other parts of the UI know.
      api.get("/api/auth/me").then(({ data }) => setUser(data.user)).catch(() => {});
    } else if (driveParam === "error") {
      const reason = searchParams.get("reason");
      const messages: Record<string, string> = {
        no_refresh_token:
          "Google didn't return a refresh token (common if Luminary was already linked to this Google account).\n\nFix: open https://myaccount.google.com/permissions — remove Luminary — then tap Connect Drive again and choose Grant / offline access.",
        auth_failed: "Connection failed. Try again or check server logs.",
        access_denied: "Google Drive access was denied.",
        invalid_grant: "Google revoked access. Try connecting again.",
      };
      const desc = reason
        ? messages[reason] ?? decodeURIComponent(reason)
        : undefined;
      if (reason === "no_refresh_token") {
        toast.error("Couldn't connect Drive", desc, 14_000);
      } else {
        toast.error("Couldn't connect Drive", desc);
      }
    }
    const params = new URLSearchParams(searchParams);
    params.delete("drive");
    params.delete("reason");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, qc, setUser, refetchDrive]);

  const totalBytes = estimate?.totalBytes ?? 0;
  const usagePct = Math.min(100, (totalBytes / FREE_DRIVE_BYTES) * 100);

  return (
    <div>
      {/* Connection card */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Google Drive</h2>
        </div>

        {statusLoading ? (
          <div className="settings-row">
            <span className="settings-row-value">
              <Loader2 className="inline h-3 w-3 animate-spin mr-1.5" />
              Loading…
            </span>
          </div>
        ) : isStatusError ? (
          <div className="settings-row settings-row-column gap-2">
            <p className="settings-row-value text-danger">
              Couldn&apos;t load Drive status. Check your connection and that the API
              URL is set for this build.
            </p>
            <p className="text-tertiary text-sm">
              {statusError instanceof Error ? statusError.message : "Request failed"}
            </p>
            <button
              type="button"
              className="btn-secondary self-start"
              onClick={() => void refetchStatus()}
            >
              Retry
            </button>
          </div>
        ) : status?.connected ? (
          <>
            <div className="settings-row drive-status-row">
              <div className="drive-status-info">
                <div className="drive-status-dot drive-status-connected" />
                <div>
                  <p className="drive-status-state">Connected</p>
                  <p className="drive-status-email">{status.email ?? "—"}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost-sm btn-ghost-sm-danger"
                onClick={() => setConfirmDisconnect(true)}
              >
                Disconnect
              </button>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Drive app folder</span>
              <span className="settings-row-value">
                {storageLoading ? (
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                ) : (
                  formatBytes(storageBytes)
                )}
              </span>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Last synced</span>
              <span className="settings-row-value">
                {status.lastSyncedAt
                  ? formatRelativeTime(status.lastSyncedAt)
                  : "Never"}
              </span>
              <button
                type="button"
                className="btn-ghost-sm settings-row-action"
                onClick={() => syncNow()}
                disabled={syncPending}
              >
                {syncPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Syncing…
                  </>
                ) : (
                  "Sync now"
                )}
              </button>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Auto sync</span>
              <select
                className="settings-select"
                value={status.syncMode}
                onChange={(e) =>
                  updateSyncMode(e.target.value as DriveStatus["syncMode"])
                }
              >
                <option value="on-save">On each save (recommended)</option>
                <option value="hourly">Every hour</option>
                <option value="daily">Daily</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
          </>
        ) : (
          <div className="settings-row drive-status-row">
            <div className="drive-status-info">
              <div className="drive-status-dot drive-status-disconnected" />
              <div>
                <p className="drive-status-state">Not connected</p>
                <p className="drive-status-email">
                  {status?.configured
                    ? "Connect Google Drive to back up your entries."
                    : "Drive isn't configured on this server."}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary settings-row-action"
              onClick={() => connect()}
              disabled={connectDisabled}
              title={
                connectDisabled && !connectPending
                  ? "Drive OAuth is not configured on the API (missing Google env vars)."
                  : undefined
              }
            >
              <Cloud size={13} /> Connect Drive
            </button>
          </div>
        )}
      </section>

      {/* Storage card */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Storage</h2>
        </div>

        <div className="settings-row settings-row-column">
          <div className="storage-bar-row">
            <span className="storage-bar-label">Used by Luminary</span>
            <span className="storage-bar-value">{formatBytes(totalBytes)}</span>
          </div>
          <div className="storage-bar-bg">
            <div
              className="storage-bar-fill"
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="storage-bar-hint">
            Based on free Google Drive storage (15 GB). Your entries typically
            take under 100 MB per year.
          </p>
        </div>

        <div className="settings-row">
          <span className="settings-row-label">Text entries</span>
          <span className="settings-row-value">
            {(estimate?.textCount ?? 0).toLocaleString()} ·{" "}
            {formatBytes(estimate?.textBytes ?? 0)}
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Audio entries</span>
          <span className="settings-row-value">
            {(estimate?.audioCount ?? 0).toLocaleString()} ·{" "}
            {formatBytes(estimate?.audioBytes ?? 0)}
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Video entries</span>
          <span className="settings-row-value">
            {(estimate?.videoCount ?? 0).toLocaleString()} ·{" "}
            {formatBytes(estimate?.videoBytes ?? 0)}
          </span>
        </div>
      </section>

      {/* Privacy notice */}
      <section className="settings-section privacy-notice-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">
            <Shield size={13} className="inline mr-1.5" strokeWidth={2.2} />
            Privacy &amp; access
          </h2>
        </div>
        <div className="privacy-notice-body">
          <p className="privacy-notice-lead">Your entries are app-only.</p>
          <p className="privacy-notice-text">
            Files are stored in a protected app-data folder on your Drive that
            only Luminary can read. You won&apos;t see your entries when
            browsing Drive directly — this keeps them private even from yourself
            if someone else opens your account. To access your data outside the
            app, use the <strong>Export</strong> tab.
          </p>
        </div>
      </section>

      <Dialog
        open={confirmDisconnect}
        onOpenChange={(o) => !o && setConfirmDisconnect(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Google Drive?</DialogTitle>
            <DialogDescription>
              Your existing files will stay in your Drive&apos;s hidden app
              folder, but Luminary won&apos;t be able to read or update them
              until you reconnect. New entries will only be stored locally.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-ghost-sm"
              onClick={() => setConfirmDisconnect(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-destructive"
              onClick={async () => {
                try {
                  await disconnect();
                  setConfirmDisconnect(false);
                } catch {
                  /* toast handled in useDrive */
                }
              }}
              disabled={disconnectPending}
            >
              {disconnectPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Disconnecting…
                </>
              ) : (
                "Disconnect"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
