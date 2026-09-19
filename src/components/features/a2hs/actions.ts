import {
  A2HS_OPEN_EVENT,
  A2HS_SNOOZE_MS,
  readA2hsState,
  writeA2hsState,
} from "./state";

export function markInstalled(): void {
  writeA2hsState({ status: "installed" });
}

export function snoozeA2hs(now = Date.now()): void {
  writeA2hsState({ status: "snoozed", snoozeUntil: now + A2HS_SNOOZE_MS });
}

export function optOutA2hs(): void {
  writeA2hsState({ status: "optout" });
}

export function markAddToHomePending(): void {
  const rec = readA2hsState();
  if (rec.status === "installed" || rec.status === "optout") return;
  if (rec.status === "snoozed") return;
  writeA2hsState({ status: "pending" });
}

export function reopenA2hsNudge(): void {
  writeA2hsState({ status: "pending" });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(A2HS_OPEN_EVENT));
  }
}

export function subscribeA2hsOpen(cb: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(A2HS_OPEN_EVENT, cb);
  return () => window.removeEventListener(A2HS_OPEN_EVENT, cb);
}
