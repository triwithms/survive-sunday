/** Next-morning America/Toronto eligibility. No database. */

export type WrapKickoff = {
  status?: string | null;
  kickoff?: Date | string | number | null;
};

const TORONTO = "America/Toronto";

export function torontoDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function kickoffDate(game: WrapKickoff): Date | null {
  const raw = game.kickoff;
  if (raw == null || raw === "") return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function latestKickoff(games: WrapKickoff[]): Date | null {
  let latest: Date | null = null;
  for (const game of games) {
    const at = kickoffDate(game);
    if (!at) continue;
    if (!latest || at.getTime() > latest.getTime()) latest = at;
  }
  return latest;
}

export function allGamesFinal(games: WrapKickoff[]): boolean {
  return (
    games.length > 0 &&
    games.every((game) => (game.status ?? "").toLowerCase() === "final")
  );
}

/** Toronto calendar days from `from` to `to`. */
export function torontoDaySpan(from: Date, to: Date): number {
  const start = Date.parse(`${torontoDateKey(from)}T00:00:00Z`);
  const end = Date.parse(`${torontoDateKey(to)}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

/**
 * Auto-send once every game is final and Toronto’s date is after the
 * last kickoff’s date (Monday and Tuesday night finales included).
 * Stays open `windowDays` so a missed cron still sends once.
 */
export function isEligibleNextMorning(
  games: WrapKickoff[],
  now: Date,
  windowDays = 7
): boolean {
  if (!allGamesFinal(games)) return false;
  const last = latestKickoff(games);
  if (!last) return false;
  const span = torontoDaySpan(last, now);
  return span >= 1 && span <= windowDays;
}

export function shouldAutoSend(opts: {
  games: WrapKickoff[];
  now: Date;
  skippedWeeks: number[];
  weekNumber: number;
}): boolean {
  if (opts.skippedWeeks.includes(opts.weekNumber)) return false;
  return isEligibleNextMorning(opts.games, opts.now);
}

export function preferredWrapWeek(
  weeks: Array<{ number: number; eligible: boolean; allFinal: boolean }>,
  fallback: number
): number {
  return (
    weeks.find((week) => week.eligible)?.number ??
    weeks.find((week) => week.allFinal)?.number ??
    weeks[0]?.number ??
    fallback
  );
}

export function wrapAutoStatus(week: {
  sent: boolean;
  skipped: boolean;
  eligible: boolean;
  allFinal: boolean;
}): string {
  if (week.sent) return "Already handled for this week. It will not send twice.";
  if (week.skipped) return "Skipped. Automatic send will not go out.";
  if (week.eligible) return "Due on the next morning check (America/Toronto).";
  if (!week.allFinal) return "Waiting until every game this week is final.";
  return "Final. Auto send is the next Toronto morning, not at the whistle.";
}
