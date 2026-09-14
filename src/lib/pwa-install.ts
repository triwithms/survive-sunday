/** Device-level Add to Home Screen prompt. localStorage is enough (per phone). */

export const ATH_STORAGE = {
  dismissed: "ss-ath-dismissed",
  snoozeUntil: "ss-ath-snooze-until",
  greetedStandalone: "ss-ath-standalone-greeted",
  pending: "ss-ath-pending",
} as const;

export type AthDecision = "hide" | "good" | "ask";

export type AthState = {
  standalone: boolean;
  mobile: boolean;
  dismissed: boolean;
  snoozed: boolean;
  pending: boolean;
  greetedStandalone: boolean;
};

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function decideAddToHomePrompt(state: AthState): AthDecision {
  if (state.standalone) {
    if (state.pending && !state.greetedStandalone) return "good";
    return "hide";
  }
  if (!state.mobile) return "hide";
  if (state.dismissed || state.snoozed) return "hide";
  if (state.pending) return "ask";
  return "hide";
}

export function isStandaloneDisplay(
  win: Pick<Window, "matchMedia" | "navigator"> | null | undefined = typeof window ===
  "undefined"
    ? null
    : window
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

export function isMobileBrowser(
  userAgent: string,
  maxTouchPoints = 0
): boolean {
  if (/Android|iPhone|iPad|iPod/i.test(userAgent)) return true;
  // iPadOS reports as Macintosh
  if (maxTouchPoints > 1 && /Mac/i.test(userAgent)) return true;
  return false;
}

export function detectIos(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return maxTouchPoints > 1 && /Mac/i.test(userAgent) && !/Android/i.test(userAgent);
}

export function detectAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function markAddToHomePending(): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(ATH_STORAGE.pending, "1");
  } catch {
    /* private mode */
  }
}

export function clearAddToHomePending(): void {
  storage()?.removeItem(ATH_STORAGE.pending);
}

export function dismissAddToHomePermanently(): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(ATH_STORAGE.dismissed, "1");
    ls.removeItem(ATH_STORAGE.pending);
    ls.removeItem(ATH_STORAGE.snoozeUntil);
  } catch {
    /* ignore */
  }
}

export function snoozeAddToHome(now = Date.now()): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(ATH_STORAGE.snoozeUntil, String(now + SNOOZE_MS));
    ls.removeItem(ATH_STORAGE.pending);
  } catch {
    /* ignore */
  }
}

export function markStandaloneGreeted(): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(ATH_STORAGE.greetedStandalone, "1");
    ls.removeItem(ATH_STORAGE.pending);
  } catch {
    /* ignore */
  }
}

export function readAthStorage(
  now = Date.now()
): Pick<AthState, "dismissed" | "snoozed" | "pending" | "greetedStandalone"> {
  const ls = storage();
  if (!ls) {
    return {
      dismissed: false,
      snoozed: false,
      pending: false,
      greetedStandalone: false,
    };
  }
  const snoozeRaw = Number(ls.getItem(ATH_STORAGE.snoozeUntil) || "0");
  return {
    dismissed: ls.getItem(ATH_STORAGE.dismissed) === "1",
    snoozed: Number.isFinite(snoozeRaw) && snoozeRaw > now,
    pending: ls.getItem(ATH_STORAGE.pending) === "1",
    greetedStandalone: ls.getItem(ATH_STORAGE.greetedStandalone) === "1",
  };
}
