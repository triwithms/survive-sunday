export type A2hsStatus = "pending" | "snoozed" | "installed" | "optout";
export type A2hsRecord = { status: A2hsStatus; snoozeUntil?: number };

export const A2HS_STORAGE_KEY = "ss_a2hs";
export const A2HS_OPEN_EVENT = "ss-a2hs-open";
export const A2HS_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function fromOld(ls: Storage): A2hsRecord | null {
  try {
    if (ls.getItem("ss-ath-dismissed") === "1") return { status: "optout" };
    if (ls.getItem("ss-ath-standalone-greeted") === "1") {
      return { status: "installed" };
    }
    const until = Number(ls.getItem("ss-ath-snooze-until") || "0");
    if (Number.isFinite(until) && until > Date.now()) {
      return { status: "snoozed", snoozeUntil: until };
    }
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

export function readA2hsState(now = Date.now()): A2hsRecord {
  const ls = store();
  if (!ls) return { status: "pending" };
  try {
    const raw = ls.getItem(A2HS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as A2hsRecord) : null;
    let rec: A2hsRecord = parsed?.status
      ? parsed
      : fromOld(ls) ?? { status: "pending" };
    if (rec.status === "snoozed" && (rec.snoozeUntil ?? 0) <= now) {
      rec = { status: "pending" };
      writeA2hsState(rec);
    } else if (!raw) {
      writeA2hsState(rec);
    }
    return rec;
  } catch {
    return { status: "pending" };
  }
}

export function shouldShowA2hs(input: {
  mobile: boolean;
  standalone: boolean;
  status: A2hsStatus;
  snoozeUntil?: number;
  now?: number;
}): boolean {
  if (input.standalone || !input.mobile) return false;
  if (input.status === "optout") return false;
  if (input.status === "snoozed") {
    return (input.snoozeUntil ?? 0) <= (input.now ?? Date.now());
  }
  return true;
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
