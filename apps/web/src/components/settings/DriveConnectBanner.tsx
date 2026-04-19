import { useQuery } from "@tanstack/react-query";
import { Cloud } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/store/authStore";

interface DriveStatus {
  connected: boolean;
  configured: boolean;
  email: string | null;
  syncMode: "on-save" | "hourly" | "daily" | "manual";
  lastSyncedAt: string | null;
}

export function DriveConnectBanner() {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  const { data: status } = useQuery<DriveStatus>({
    queryKey: ["drive", "status"],
    queryFn: async () => (await api.get<DriveStatus>("/api/drive/status")).data,
    enabled: !!user,
    staleTime: 30_000,
  });

  const hidden = useMemo(() => {
    if (!status) return true;
    if (status.connected) return true;
    // Already on the storage tab — the storage panel itself surfaces the
    // connect CTA, no need for a duplicate banner.
    if (tab === "storage") return true;
    return false;
  }, [status, tab]);

  if (hidden) return null;

  async function handleConnect() {
    try {
      const { data } = await api.get<{ url: string }>("/api/drive/connect");
      window.location.href = data.url;
    } catch (err) {
      toast.error("Couldn't start Drive flow", apiErrorMessage(err));
    }
  }

  return (
    <div className="drive-connect-banner">
      <div className="drive-connect-banner-icon" aria-hidden>
        <Cloud size={18} strokeWidth={2} />
      </div>
      <div className="drive-connect-banner-text">
        <p className="drive-connect-banner-title">
          Back up your data with Google Drive
        </p>
        <p className="drive-connect-banner-description">
          {status?.configured
            ? "Connect your Google Drive to sync entries so nothing is ever lost. Files stay in a private app-only folder."
            : "Drive integration isn't configured on this server yet. Once your admin sets it up, you'll be able to back up entries here."}
        </p>
      </div>
      <button
        type="button"
        className="btn-primary drive-connect-banner-cta"
        onClick={handleConnect}
        disabled={!status?.configured}
        title={
          status?.configured
            ? "Open Google sign-in"
            : "Drive isn't configured on the server"
        }
      >
        <Cloud size={14} strokeWidth={2} />
        Connect Drive
      </button>
    </div>
  );
}
