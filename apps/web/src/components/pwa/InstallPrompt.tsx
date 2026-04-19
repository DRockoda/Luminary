import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "luminary_install_dismissed";
const IOS_TIP_KEY = "luminary_ios_install_shown";

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS
  return Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosVisible, setIosVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      const t = window.setTimeout(() => {
        let dismissed = false;
        try {
          dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
        } catch {
          /* ignore */
        }
        if (!dismissed) setVisible(true);
      }, 30_000);
      return () => window.clearTimeout(t);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // iOS Safari has no beforeinstallprompt — show a manual tip.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneMode()) return;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (!isIOS) return;
    let shown = false;
    try {
      shown = localStorage.getItem(IOS_TIP_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (shown) return;
    const t = window.setTimeout(() => setIosVisible(true), 30_000);
    return () => window.clearTimeout(t);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function dismissIos() {
    try {
      localStorage.setItem(IOS_TIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setIosVisible(false);
  }

  if (!visible && !iosVisible) return null;

  if (iosVisible) {
    return (
      <div className="install-prompt" role="dialog" aria-label="Install Luminary">
        <button onClick={dismissIos} aria-label="Close" className="install-prompt-close">
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="install-prompt-content">
          <div className="install-prompt-icon">
            <Share className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <p className="install-prompt-title">Install Luminary on your iPhone</p>
            <p className="install-prompt-subtitle">
              Tap the Share button, then "Add to Home Screen".
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Luminary">
      <button onClick={dismiss} aria-label="Close" className="install-prompt-close">
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="install-prompt-content">
        <div className="install-prompt-icon">
          <Download className="h-4 w-4" strokeWidth={2} />
        </div>
        <div>
          <p className="install-prompt-title">Install Luminary</p>
          <p className="install-prompt-subtitle">
            Faster access, offline use, and a calm app icon on your home screen.
          </p>
        </div>
      </div>
      <div className="install-prompt-actions">
        <button className="btn-ghost-sm" onClick={dismiss}>
          Not now
        </button>
        <button className="install-prompt-btn-primary" onClick={install}>
          Install
        </button>
      </div>
    </div>
  );
}
