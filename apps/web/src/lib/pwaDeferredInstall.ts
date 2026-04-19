/** Captures Chromium `beforeinstallprompt` early so the browser does not show its own install UI. */

export const PWA_INSTALLABLE_EVENT = "luminary:pwa-installable";

export interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEventLike | null = null;
let initialized = false;

export function getDeferredInstallPrompt(): BeforeInstallPromptEventLike | null {
  return deferred;
}

export function clearDeferredInstallPrompt(): void {
  deferred = null;
}

/** Call once before React mounts. */
export function initPwaInstallCapture(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  const handler = (e: Event) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEventLike;
    window.dispatchEvent(new CustomEvent(PWA_INSTALLABLE_EVENT));
  };

  window.addEventListener("beforeinstallprompt", handler);
}
