/** Display-mode and UA helpers for the Home Screen nudge. */

export function isStandalone(
  win: Pick<Window, "matchMedia" | "navigator"> | null | undefined =
    typeof window === "undefined" ? null : window
): boolean {
  if (!win) return false;
  try {
    if (win.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  } catch {
    /* ignore */
  }
  const nav = win.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function isMobile(userAgent: string, maxTouchPoints = 0): boolean {
  if (/Android|iPhone|iPad|iPod/i.test(userAgent)) return true;
  return maxTouchPoints > 1 && /Mac/i.test(userAgent);
}

export function isIOS(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return (
    maxTouchPoints > 1 && /Mac/i.test(userAgent) && !/Android/i.test(userAgent)
  );
}

export function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|Instagram|WhatsApp|Line/i.test(userAgent);
}

export function isSafari(userAgent: string): boolean {
  return (
    /Safari/i.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|Chrome|Chromium/i.test(userAgent)
  );
}

export type A2hsVariant = "ios" | "android" | "inapp";

export function a2hsVariant(
  userAgent: string,
  maxTouchPoints = 0
): A2hsVariant {
  if (isInAppBrowser(userAgent)) return "inapp";
  if (isIOS(userAgent, maxTouchPoints) && !isSafari(userAgent)) return "inapp";
  if (isIOS(userAgent, maxTouchPoints)) return "ios";
  return "android";
}

export function clientUa(): { ua: string; touch: number } {
  if (typeof navigator === "undefined") return { ua: "", touch: 0 };
  return { ua: navigator.userAgent, touch: navigator.maxTouchPoints || 0 };
}
