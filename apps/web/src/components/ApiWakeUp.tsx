import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { resolveApiBaseURL } from "@/lib/apiBaseUrl";

type WakeUpState = "checking" | "warming" | "ready" | "error";

export function ApiWakeUp({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WakeUpState>("checking");
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState("");
  const startTime = useRef(Date.now());

  const isAdminRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  if (isAdminRoute) return <>{children}</>;

  useEffect(() => {
    const dotsTimer = window.setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : `${d}.`));
    }, 400);

    const elapsedTimer = window.setInterval(() => {
      const secs = Math.floor((Date.now() - startTime.current) / 1000);
      setElapsed(secs);
      if (secs >= 5) setState((prev) => (prev === "checking" ? "warming" : prev));
    }, 1000);

    const base = resolveApiBaseURL().trim();
    const healthUrl = base ? `${base.replace(/\/$/, "")}/api/health` : "/api/health";
    let attempts = 0;
    let cancelled = false;
    let retryTimeout: number | null = null;

    const tryPing = async () => {
      attempts += 1;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(healthUrl, { signal: controller.signal });
        if (!cancelled && res.ok) {
          window.clearInterval(elapsedTimer);
          window.clearInterval(dotsTimer);
          window.setTimeout(() => setState("ready"), 300);
          return;
        }
      } catch {
        // keep retrying while within attempt window
      } finally {
        window.clearTimeout(timeout);
      }

      if (cancelled) return;
      if (attempts >= 30) {
        setState("error");
        return;
      }
      retryTimeout = window.setTimeout(tryPing, 3000);
    };

    void tryPing();

    return () => {
      cancelled = true;
      window.clearInterval(elapsedTimer);
      window.clearInterval(dotsTimer);
      if (retryTimeout !== null) window.clearTimeout(retryTimeout);
    };
  }, []);

  const message =
    state === "checking"
      ? `Connecting${dots}`
      : elapsed < 15
        ? `Warming up the server${dots}`
        : elapsed < 35
          ? `Almost there${dots}`
          : elapsed < 55
            ? `Just a few more seconds${dots}`
            : `Taking longer than usual${dots}`;

  const subMessage =
    state === "checking" || elapsed < 5
      ? null
      : elapsed < 20
        ? "Our server is waking up from sleep. This only happens on the first visit."
        : elapsed < 45
          ? "Free tier servers take a moment to spin up. Thanks for your patience!"
          : "Hang tight - we're almost ready for you.";

  return (
    <AnimatePresence mode="wait">
      {state !== "ready" ? (
        <motion.div
          key="wakeup"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <WakeUpScreen
            state={state}
            elapsed={elapsed}
            message={message}
            subMessage={subMessage}
          />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ width: "100%", minHeight: "100vh" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function WakeUpScreen({
  state,
  elapsed,
  message,
  subMessage,
}: {
  state: WakeUpState;
  elapsed: number;
  message: string;
  subMessage: string | null;
}) {
  const progress = Math.min((elapsed / 60) * 100, 95);
  return (
    <div className="wakeup-shell">
      <div className="wakeup-bg">
        <div className="wakeup-blob wakeup-blob-1" />
        <div className="wakeup-blob wakeup-blob-2" />
        <div className="wakeup-blob wakeup-blob-3" />
      </div>

      <div className="wakeup-card">
        <div className="wakeup-logo">
          <div className="wakeup-logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="var(--accent)" opacity="0.15" />
              <circle cx="14" cy="14" r="9" fill="var(--accent)" opacity="0.3" />
              <circle cx="14" cy="14" r="5" fill="var(--accent)" />
            </svg>
          </div>
          <span className="wakeup-logo-name">Luminary</span>
        </div>

        <div className="wakeup-orb-wrapper">
          <div className="wakeup-ring wakeup-ring-1" />
          <div className="wakeup-ring wakeup-ring-2" />
          <div className="wakeup-ring wakeup-ring-3" />
          <div className="wakeup-orb">
            {state === "error" ? (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
          </div>
        </div>

        <h2 className="wakeup-message">{message}</h2>
        {subMessage && <p className="wakeup-sub">{subMessage}</p>}

        {elapsed >= 5 && (
          <div className="wakeup-progress-wrapper">
            <div className="wakeup-progress-bar">
              <div className="wakeup-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            {elapsed >= 3 && <span className="wakeup-elapsed">{elapsed}s</span>}
          </div>
        )}

        {state === "error" && (
          <button className="wakeup-retry-btn" onClick={() => window.location.reload()}>
            Try again
          </button>
        )}

        {elapsed >= 20 && state !== "error" && (
          <div className="wakeup-fact">
            <span className="wakeup-fact-label">While you wait</span>
            <p className="wakeup-fact-text">
              Luminary stores your audio and video in your own Google Drive - your
              memories are always yours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

