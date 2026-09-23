export const WEEK_WRAP_TONES = ["funny", "facts", "short"] as const;
export type WeekWrapTone = (typeof WEEK_WRAP_TONES)[number];

export const WEEK_WRAP_TONE_LABEL: Record<WeekWrapTone, string> = {
  funny: "Funny",
  facts: "Straight facts",
  short: "Short (SMS-friendly)",
};

export type WeekWrapBlocks = {
  roster: boolean;
  picks: boolean;
  board: boolean;
  drama: boolean;
};

export const DEFAULT_WEEK_WRAP_BLOCKS: WeekWrapBlocks = {
  roster: true,
  picks: true,
  board: true,
  drama: true,
};

export type WeekWrapPlayer = {
  nickname: string;
  status: string;
  teamAbbr: string | null;
  result: string | null;
  eliminatedThisWeek: boolean;
};

export type WeekWrapFacts = {
  weekNumber: number;
  players: WeekWrapPlayer[];
  boardUrl: string;
};

export type WeekWrapSettings = {
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  emailOverride: string;
  smsOverride: string;
  skippedWeeks: number[];
};

export const DEFAULT_WEEK_WRAP_SETTINGS: WeekWrapSettings = {
  tone: "facts",
  blocks: { ...DEFAULT_WEEK_WRAP_BLOCKS },
  emailOverride: "",
  smsOverride: "",
  skippedWeeks: [],
};

export type WeekWrapWeekOption = {
  number: number;
  allFinal: boolean;
  eligible: boolean;
  skipped: boolean;
  sent: boolean;
  players: WeekWrapPlayer[];
};

export type WeekWrapPanelData = {
  boardUrl: string;
  selectedWeek: number;
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  emailOverride: string;
  smsOverride: string;
  weeks: WeekWrapWeekOption[];
};

export function weekWrapDedupeKey(poolId: string, weekNumber: number): string {
  return `wrap:${poolId}:w${weekNumber}`;
}

/** Channel suffixes match dispatchNotice claim keys. */
export function weekWrapClaimKeys(poolId: string, weekNumber: number) {
  const base = weekWrapDedupeKey(poolId, weekNumber);
  return { base, email: `${base}:email`, sms: `${base}:sms` };
}

export function isWeekWrapTone(value: unknown): value is WeekWrapTone {
  return (
    typeof value === "string" &&
    (WEEK_WRAP_TONES as readonly string[]).includes(value)
  );
}

export function parseSkippedWeeks(json: string | null | undefined): number[] {
  try {
    const arr = JSON.parse(json || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.filter((n) => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

export function parseWeekWrapBlocks(value: unknown): WeekWrapBlocks {
  const row =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const flag = (key: keyof WeekWrapBlocks) =>
    typeof row[key] === "boolean" ? (row[key] as boolean) : true;
  return {
    roster: flag("roster"),
    picks: flag("picks"),
    board: flag("board"),
    drama: flag("drama"),
  };
}

export function withSkippedWeek(
  weeks: number[],
  weekNumber: number,
  skip: boolean
): number[] {
  const set = new Set(weeks);
  if (skip) set.add(weekNumber);
  else set.delete(weekNumber);
  return [...set].sort((a, b) => a - b);
}

export type WeekWrapRequest = {
  action: "save" | "send" | "skip";
  weekNumber: number;
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  emailOverride: string;
  smsOverride: string;
};

const EMAIL_MAX = 4000;
const SMS_MAX = 500;

export function parseWeekWrapRequest(
  body: unknown
): { ok: true; value: WeekWrapRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request" };
  }
  const row = body as Record<string, unknown>;
  const action = row.action;
  if (action !== "save" && action !== "send" && action !== "skip") {
    return { ok: false, error: "Choose save, send, or skip" };
  }
  const weekNumber = row.weekNumber;
  if (
    typeof weekNumber !== "number" ||
    !Number.isInteger(weekNumber) ||
    weekNumber < 1 ||
    weekNumber > 30
  ) {
    return { ok: false, error: "Pick a week" };
  }
  if (!isWeekWrapTone(row.tone)) {
    return { ok: false, error: "Choose Funny, Straight facts, or Short" };
  }
  const emailOverride =
    typeof row.emailOverride === "string" ? row.emailOverride.trim() : "";
  const smsOverride =
    typeof row.smsOverride === "string" ? row.smsOverride.trim() : "";
  if (emailOverride.length > EMAIL_MAX) {
    return { ok: false, error: "Email override is too long" };
  }
  if (smsOverride.length > SMS_MAX) {
    return { ok: false, error: "SMS override is too long" };
  }
  return {
    ok: true,
    value: {
      action,
      weekNumber,
      tone: row.tone,
      blocks: parseWeekWrapBlocks(row.blocks),
      emailOverride,
      smsOverride,
    },
  };
}

export function weekNumbersFromDedupeKeys(
  keys: string[],
  poolId: string
): Set<number> {
  const set = new Set<number>();
  const prefix = `wrap:${poolId}:w`;
  for (const key of keys) {
    if (!key.startsWith(prefix)) continue;
    const num = Number.parseInt(key.slice(prefix.length), 10);
    if (Number.isInteger(num) && num > 0) set.add(num);
  }
  return set;
}
