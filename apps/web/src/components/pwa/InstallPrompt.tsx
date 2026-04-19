import { Download, Share, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getDeferredInstallPrompt,
  clearDeferredInstallPrompt,
  PWA_INSTALLABLE_EVENT,
} from "@/lib/pwaDeferredInstall";

const DISMISSED_KEY = "luminary_install_dismissed";
const IOS_TIP_KEY = "luminary_ios_install_shown";

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosVisible, setIosVisible] = useState(false);
  const bannerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStandaloneMode()) return;

    function clearBannerTimer() {
      if (bannerTimerRef.current !== null) {
        window.clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = null;
      }
    }

    function scheduleBanner() {
      if (getDeferredInstallPrompt() === null) return;
      clearBannerTimer();
      let dismissed = false;
      try {
        dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
      } catch {
        /* ignore */
      }
      if (dismissed) return;
      bannerTimerRef.current = window.setTimeout(() => setVisible(true), 30_000);
    }

    scheduleBanner();
    window.addEventListener(PWA_INSTALLABLE_EVENT, scheduleBanner);
    return () => {
      window.removeEventListener(PWA_INSTALLABLE_EVENT, scheduleBanner);
      clearBannerTimer();
    };
  }, []);

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
    const deferred = getDeferredInstallPrompt();
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
    } finally {
      clearDeferredInstallPrompt();
    }
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
        <button type="button" onClick={dismissIos} aria-label="Close" className="install-prompt-close">
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="install-prompt-content">
          <div className="install-prompt-icon">
            <Share className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <p className="install-prompt-title">Install Luminary on your iPhone</p>
            <p className="install-prompt-subtitle">
              Tap the Share button, then &quot;Add to Home Screen&quot;.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Luminary">
      <button type="button" onClick={dismiss} aria-label="Close" className="install-prompt-close">
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
        <button type="button" className="btn-ghost-sm" onClick={dismiss}>
          Not now
        </button>
        <button type="button" className="install-prompt-btn-primary" onClick={() => void install()}>
          Install
        </button>
      </div>
    </div>
  );
}
