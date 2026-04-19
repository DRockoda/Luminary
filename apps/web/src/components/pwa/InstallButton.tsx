import { Download, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function IOSInstructions({ onClose }: { onClose: () => void }) {
  return (
    <div className="ios-instructions-overlay" onClick={onClose} role="presentation">
      <div
        className="ios-instructions-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="ios-install-title"
      >
        <h3 id="ios-install-title">Add to Home Screen</h3>
        <ol>
          <li>
            Tap the <strong>Share</strong> button in Safari
          </li>
          <li>
            Scroll down and tap <strong>Add to Home Screen</strong>
          </li>
          <li>
            Tap <strong>Add</strong> in the top right
          </li>
        </ol>
        <button type="button" onClick={onClose} className="landing-btn-primary ios-instructions-got-it">
          Got it
        </button>
      </div>
    </div>
  );
}

export function InstallButton({ variant = "default" }: { variant?: "default" | "hero" | "footer" }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }
    setIsIOS(isIosSafari());
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferred) {
      toast.info(
        "Install",
        "Use your browser’s install option in the address bar when it appears, or try again after browsing a bit.",
      );
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferred(null);
  }, [deferred, isIOS]);

  if (isInstalled) return null;

  const label = isIOS ? "Add to Home Screen" : "Install App";

  if (variant === "hero") {
    return (
      <>
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="landing-btn-secondary hero-install-btn"
          aria-label={label}
        >
          <Smartphone className="h-4 w-4" strokeWidth={2} />
          {label}
        </button>
        {showIOSInstructions && <IOSInstructions onClose={() => setShowIOSInstructions(false)} />}
      </>
    );
  }

  if (variant === "footer") {
    return (
      <>
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="footer-install-btn"
          aria-label={label}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          {label}
        </button>
        {showIOSInstructions && <IOSInstructions onClose={() => setShowIOSInstructions(false)} />}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="install-pill-btn"
        aria-label={label}
      >
        <Download className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </button>
      {showIOSInstructions && <IOSInstructions onClose={() => setShowIOSInstructions(false)} />}
    </>
  );
}
