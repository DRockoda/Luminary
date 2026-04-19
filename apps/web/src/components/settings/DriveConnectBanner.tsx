import { Cloud } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDrive } from "@/hooks/useDrive";
import { useAuthStore } from "@/store/authStore";

export function DriveConnectBanner() {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  const { status, connect, connectPending, connectDisabled } = useDrive({
    statusEnabled: Boolean(user),
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
        onClick={() => connect()}
        disabled={connectDisabled}
        title={
          connectDisabled && !connectPending
            ? "Drive OAuth is not configured on the API (missing Google env vars)."
            : "Open Google sign-in"
        }
      >
        <Cloud size={14} strokeWidth={2} />
        Connect Drive
      </button>
    </div>
  );
}
