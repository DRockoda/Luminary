import { useEffect, useState } from "react";

export function MaintenancePage() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : `${d}.`));
    }, 500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="maintenance-shell">
      <div className="maintenance-bg" aria-hidden>
        <div className="maintenance-blob blob-1" />
        <div className="maintenance-blob blob-2" />
        <div className="maintenance-blob blob-3" />
      </div>

      <div className="maintenance-card">
        <div className="maintenance-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
            <circle cx="24" cy="24" r="24" fill="var(--accent)" opacity="0.15" />
            <circle cx="24" cy="24" r="16" fill="var(--accent)" opacity="0.25" />
            <circle cx="24" cy="24" r="8" fill="var(--accent)" />
          </svg>
          <span className="maintenance-logo-name">Luminary</span>
        </div>

        <div className="maintenance-icon-wrapper">
          <div className="maintenance-icon-ring ring-1" />
          <div className="maintenance-icon-ring ring-2" />
          <div className="maintenance-icon-ring ring-3" />
          <div className="maintenance-icon-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
        </div>

        <h1 className="maintenance-title">
          We&apos;re improving your experience{dots}
        </h1>
        <p className="maintenance-subtitle">
          Thanks for your patience. Luminary is currently undergoing scheduled maintenance to make
          things better for you. We&apos;ll be back shortly.
        </p>

        <div className="maintenance-progress">
          <div className="maintenance-progress-bar" />
        </div>

        <div className="maintenance-status">
          <div className="maintenance-status-dot" />
          <span>Maintenance in progress</span>
        </div>

        <p className="maintenance-footer">
          Questions? Reach us at{" "}
          <a href="mailto:hello@luminary.app">hello@luminary.app</a>
        </p>
      </div>
    </div>
  );
}
