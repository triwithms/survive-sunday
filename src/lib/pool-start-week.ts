/** First week a pool counts. Pure — no database. */

import { isGameStarted, type GameStartBits } from "./pick-change";
import { formatEasternDateTime } from "./eastern-time";

export const REGULAR_SEASON_LAST_WEEK = 18;

export type KickoffGame = GameStartBits & {
  kickoff?: Date | string | number | null;
};

export type KickoffWeek = {
  number: number;
  games: KickoffGame[];
};

export function isRegularSeasonWeek(week: number): boolean {
  return Number.isInteger(week) && week >= 1 && week <= REGULAR_SEASON_LAST_WEEK;
}

/** null start = classic pool: every week counts. */
export function weekCountsForPool(
  startWeek: number | null | undefined,
  weekNumber: number
): boolean {
  if (startWeek == null) return true;
  return weekNumber >= startWeek;
}

export function weeksFromPoolStart<T extends { number: number }>(
  weeks: T[],
  startWeek: number | null | undefined
): T[] {
  if (startWeek == null || startWeek <= 1) return weeks;
  return weeks.filter((week) => week.number >= startWeek);
}

function firstGame(week: KickoffWeek | undefined): KickoffGame | null {
  if (!week || week.games.length === 0) return null;
  let best: KickoffGame | null = null;
  let bestMs = Number.POSITIVE_INFINITY;
  for (const game of week.games) {
    if (game.kickoff == null || game.kickoff === "") continue;
    const ms = new Date(game.kickoff).getTime();
    if (!Number.isFinite(ms) || ms >= bestMs) continue;
    best = game;
    bestMs = ms;
  }
  return best ?? week.games[0] ?? null;
}

/**
 * Earliest regular-season week still open to start a pool.
 * Current slate week if its first game has not kicked off; otherwise the next week.
 * Null when the regular season has no week left.
 */
export function earliestPlayableWeek(args: {
  currentWeek: number;
  weeks: KickoffWeek[];
  now?: Date;
}): number | null {
  const now = args.now ?? new Date();
  const current = isRegularSeasonWeek(args.currentWeek) ? args.currentWeek : 1;
  const row = args.weeks.find((week) => week.number === current);
  const started = isGameStarted(firstGame(row), now);
  const week = started ? current + 1 : current;
  return isRegularSeasonWeek(week) ? week : null;
}

export function futureStartWeekChoices(earliest: number | null): number[] {
  if (earliest == null || !isRegularSeasonWeek(earliest)) return [];
  const choices: number[] = [];
  for (let week = earliest; week <= REGULAR_SEASON_LAST_WEEK; week += 1) {
    choices.push(week);
  }
  return choices;
}

/** Undefined when the value is not one of the weeks still open to choose. */
export function parseStartWeekChoice(
  raw: unknown,
  allowed: readonly number[]
): number | undefined {
  const week = typeof raw === "number" ? raw : Number(raw);
  if (!isRegularSeasonWeek(week)) return undefined;
  if (!allowed.includes(week)) return undefined;
  return week;
}

/**
 * Seat floor. A null late-join stamp stays null on a classic pool.
 * A later pool start still raises the floor.
 */
export function seatPlayingFromWeek(args: {
  startWeek: number | null | undefined;
  lateJoinWeek: number | null;
}): number | null {
  const floor = args.startWeek ?? 1;
  if (args.lateJoinWeek == null) return floor > 1 ? floor : null;
  return Math.max(floor, args.lateJoinWeek);
}

/** "No mulligan" applies from the pool's first week, not from a week that does not count. */
export function mulliganAppliesFrom(
  choice: number | null,
  startWeek: number | null | undefined
): number | null {
  if (choice == null) return null;
  const floor = startWeek != null && startWeek > 1 ? startWeek : 1;
  return Math.max(choice, floor);
}

export function mulliganBeforePoolStart(
  fromWeek: number | null,
  startWeek: number | null | undefined
): boolean {
  if (fromWeek == null || startWeek == null) return false;
  return fromWeek < startWeek;
}

export function pickBeforePoolStartError(
  startWeek: number | null | undefined,
  weekNumber: number
): string | null {
  if (weekCountsForPool(startWeek, weekNumber)) return null;
  return `This pool starts Week ${startWeek}. Earlier weeks do not count.`;
}

/** Share / heading chip. Null when that week is before the pool starts. */
export function leaderboardWeekChip(
  weekNumber: number,
  startWeek: number | null | undefined,
  label: string
): string | null {
  if (!weekCountsForPool(startWeek, weekNumber)) return null;
  return label;
}

/**
 * When Week N picks become available: the first kickoff of the week before,
 * which is when this app opens the next week. Falls back to Week N's first game.
 */
export function picksOpenAtForStart(
  startWeek: number,
  weeks: KickoffWeek[]
): Date | null {
  const prior = weeks.find((week) => week.number === startWeek - 1);
  const start = weeks.find((week) => week.number === startWeek);
  const game = firstGame(prior && prior.games.length > 0 ? prior : start);
  if (!game || game.kickoff == null || game.kickoff === "") return null;
  const date = new Date(game.kickoff);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatPoolStartDate(date: Date): string {
  return formatEasternDateTime(
    date,
    { weekday: "short", month: "short", day: "numeric" },
    false
  );
}

/** Quiet line before the first week. Hidden once that week's picks are open. */
export function poolStartBanner(args: {
  startWeek: number | null | undefined;
  poolCurrentWeek: number;
  canPickStartWeek: boolean;
  picksOpenAt: Date | null;
}): string | null {
  const start = args.startWeek;
  if (start == null || start <= 1) return null;
  if (args.poolCurrentWeek >= start) return null;
  if (args.canPickStartWeek) return null;
  const date = args.picksOpenAt ? formatPoolStartDate(args.picksOpenAt) : "soon";
  return `This pool starts Week ${start}. Picks open ${date}.`;
}
