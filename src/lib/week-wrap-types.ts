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
