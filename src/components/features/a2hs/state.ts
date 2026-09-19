export type A2hsStatus = "pending" | "not_now" | "installed" | "optout";
export type A2hsRecord = { status: A2hsStatus };

export const A2HS_STORAGE_KEY = "ss_a2hs";
export const A2HS_OPEN_EVENT = "ss-a2hs-open";

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalize(status: string | undefined): A2hsStatus {
  if (status === "optout") return "optout";
  if (status === "installed") return "installed";
  if (status === "not_now" || status === "snoozed") return "not_now";
  return "pending";
}

function fromOld(ls: Storage): A2hsRecord | null {
  try {
    if (ls.getItem("ss-ath-dismissed") === "1") return { status: "optout" };
    if (ls.getItem("ss-ath-standalone-greeted") === "1") {
      return { status: "installed" };
    }
    if (ls.getItem("ss-ath-snooze-until")) return { status: "not_now" };
    if (ls.getItem("ss-ath-pending") === "1") return { status: "pending" };
  } catch {
    /* ignore */
  }
  return null;
}

export function writeA2hsState(rec: A2hsRecord): void {
  const ls = store();
  if (!ls) return;
  try {
    ls.setItem(A2HS_STORAGE_KEY, JSON.stringify(rec));
  } catch {
    /* private mode */
  }
}

export function readA2hsState(): A2hsRecord {
  const ls = store();
  if (!ls) return { status: "pending" };
  try {
    const raw = ls.getItem(A2HS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { status?: string }) : null;
    const rec: A2hsRecord = parsed?.status
      ? { status: normalize(parsed.status) }
      : fromOld(ls) ?? { status: "pending" };
    if (!raw || rec.status !== parsed?.status) writeA2hsState(rec);
    return rec;
  } catch {
    return { status: "pending" };
  }
}

/** Login resets Not now so the card can ask again. No stays quiet. */
export function statusAfterLogin(rec: A2hsRecord): A2hsRecord {
  if (rec.status === "optout") return rec;
  return { status: "pending" };
}

export function shouldShowA2hs(input: {
  mobile: boolean;
  standalone: boolean;
  status: A2hsStatus;
}): boolean {
  if (input.standalone || !input.mobile) return false;
  return input.status === "pending";
}

/** Icon removed: browser again, so ask again. Opt-out stays quiet. */
export function reconcileA2hs(
  rec: A2hsRecord,
  standalone: boolean
): A2hsRecord {
  if (standalone) return { status: "installed" };
  if (rec.status === "installed") return { status: "pending" };
  return rec;
}
