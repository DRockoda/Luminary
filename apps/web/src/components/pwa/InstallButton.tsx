import { Download, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  type BeforeInstallPromptEventLike,
  getDeferredInstallPrompt,
  clearDeferredInstallPrompt,
  PWA_INSTALLABLE_EVENT,
} from "@/lib/pwaDeferredInstall";

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  return Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function InstallInstructions({
  isIOS,
  onClose,
}: {
  isIOS: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="install-instructions-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="install-instructions-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-instructions-title"
      >
        <div className="install-instructions-header">
          <h3 id="install-instructions-title">Install Luminary</h3>
          <button
            type="button"
            onClick={onClose}
            className="install-instructions-close"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {isIOS ? (
          <ol className="install-instructions-steps">
            <li>
              Tap the <strong>Share</strong> button at the bottom of Safari
            </li>
            <li>
              Scroll down and tap <strong>Add to Home Screen</strong>
            </li>
            <li>
              Tap <strong>Add</strong> in the top right corner
            </li>
          </ol>
        ) : (
          <ol className="install-instructions-steps">
            <li>
              Look for the <strong>install icon</strong> in your browser&apos;s address bar
            </li>
            <li>
              Select <strong>Install</strong> or <strong>Install app</strong>
            </li>
            <li>
              Or open the browser <strong>menu</strong> and choose <strong>Install app</strong>{" "}
              / <strong>Add to Home screen</strong>
            </li>
          </ol>
        )}

        <button type="button" onClick={onClose} className="btn-primary install-instructions-done">
          Got it
        </button>
      </div>
    </div>
  );
}

export function InstallButton({ variant = "default" }: { variant?: "default" | "hero" | "footer" }) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const refreshPrompt = useCallback(() => {
    if (getDeferredInstallPrompt()) setCanInstall(true);
  }, []);

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }
    const ios = isIosDevice();
    setIsIOS(ios);
    if (ios) {
      setCanInstall(true);
      return;
    }
    refreshPrompt();
    window.addEventListener(PWA_INSTALLABLE_EVENT, refreshPrompt);
    return () => window.removeEventListener(PWA_INSTALLABLE_EVENT, refreshPrompt);
  }, [refreshPrompt]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowInstructions(true);
      return;
    }
    const prompt = getDeferredInstallPrompt() as BeforeInstallPromptEventLike | null;
    if (!prompt) {
      setShowInstructions(true);
      return;
    }
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
    } catch {
      setShowInstructions(true);
    } finally {
      clearDeferredInstallPrompt();
      setCanInstall(false);
    }
  }, [isIOS]);

  if (isInstalled) return null;
  const alwaysOffer = variant === "hero" || variant === "footer";
  if (!alwaysOffer && !canInstall && !isIOS) return null;

  const label = isIOS ? "Add to Home Screen" : "Install App";
  const Icon = isIOS ? Smartphone : Download;

  const btnClass =
    variant === "hero"
      ? cn("install-btn install-btn-hero", "landing-btn-secondary hero-install-btn")
      : variant === "footer"
        ? cn("install-btn install-btn-footer", "footer-install-btn")
        : "install-btn install-btn-default";

  return (
    <>
      <button type="button" onClick={() => void handleInstall()} className={btnClass} aria-label={label}>
        <Icon className={cn("shrink-0", variant === "footer" ? "h-3.5 w-3.5" : "h-4 w-4")} strokeWidth={2} />
        <span>{label}</span>
      </button>
      {showInstructions && (
        <InstallInstructions isIOS={isIOS} onClose={() => setShowInstructions(false)} />
      )}
    </>
  );
}
