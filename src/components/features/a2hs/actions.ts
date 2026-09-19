import {
  A2HS_OPEN_EVENT,
  readA2hsState,
  statusAfterLogin,
  writeA2hsState,
} from "./state";

export function markInstalled(): void {
  writeA2hsState({ status: "installed" });
}

export function markNotNow(): void {
  writeA2hsState({ status: "not_now" });
}

export function optOutA2hs(): void {
  writeA2hsState({ status: "optout" });
}

export function markAddToHomePending(): void {
  writeA2hsState(statusAfterLogin(readA2hsState()));
}

/** Help / Account: open the Yes instructions. Clears opt-out for this path. */
export function reopenA2hsNudge(yes = false): void {
  writeA2hsState({ status: "pending" });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(A2HS_OPEN_EVENT, { detail: { yes } }));
  }
}

export function subscribeA2hsOpen(cb: (yes: boolean) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const fn = (e: Event) => {
    cb(e instanceof CustomEvent && Boolean((e.detail as { yes?: boolean })?.yes));
  };
  window.addEventListener(A2HS_OPEN_EVENT, fn);
  return () => window.removeEventListener(A2HS_OPEN_EVENT, fn);
}
