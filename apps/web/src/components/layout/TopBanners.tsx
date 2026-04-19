import { AlertCircle, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useActiveAnnouncement } from "@/hooks/useAnnouncement";
import { useDismissWarning, useWarnings } from "@/hooks/useWarnings";

const ANNOUNCEMENT_DISMISSED_KEY = (id: string) => `luminary_dismissed_announcement_${id}`;

export function TopBanners() {
  const ref = useRef<HTMLDivElement>(null);

  const { data: announcement } = useActiveAnnouncement();
  const { data: warnings = [] } = useWarnings();
  const dismissWarning = useDismissWarning();

  const [annDismissed, setAnnDismissed] = useState<boolean>(() => {
    if (!announcement?.id) return false;
    try {
      return localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY(announcement.id)) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!announcement?.id) return;
    try {
      setAnnDismissed(
        localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY(announcement.id)) === "1",
      );
    } catch {
      setAnnDismissed(false);
    }
  }, [announcement?.id]);

  // Keep --top-banners-height in sync so fixed sidebar offsets correctly.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        "--top-banners-height",
        `${el.offsetHeight}px`,
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function dismissAnnouncement() {
    if (!announcement?.id) return;
    try {
      localStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY(announcement.id), "1");
    } catch {
      /* ignore */
    }
    setAnnDismissed(true);
  }

  const showAnnouncement = !!announcement && !annDismissed;

  return (
    <div ref={ref} className="top-banners">
      {showAnnouncement && announcement && (
        <div className={`announcement-banner announcement-${announcement.color}`}>
          <span className="announcement-text">{announcement.message}</span>
          {announcement.link ? (
            <a href={announcement.link} target="_blank" rel="noopener noreferrer">
              {announcement.linkLabel || "Learn more"} →
            </a>
          ) : null}
          <button
            type="button"
            onClick={dismissAnnouncement}
            aria-label="Dismiss announcement"
            className="announcement-dismiss-btn"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}

      {warnings.map((w) => (
        <div key={w.id} className={`user-warning-banner warning-${w.level}`}>
          <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="user-warning-text">{w.message}</span>
          <button
            type="button"
            onClick={() => dismissWarning.mutate(w.id)}
            aria-label="Dismiss"
            className="user-warning-dismiss-btn"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}
