import {
  gameForPick,
  isUserPick,
  type ExistingPickBits,
  type GameStartBits,
} from "./pick-change";
import { isPlayerPickWeek, resolvePlayerPickWeek } from "./next-week-picks";

export type EnterPickWeekGame = GameStartBits & {
  id: string;
  awayAbbr: string;
  homeAbbr: string;
};

export type EnterPickWeekBits = {
  number: number;
  locked: boolean;
  games: EnterPickWeekGame[];
};

export type EnterPickMemberBits = {
  playingFromWeek?: number | null;
  picks: Array<ExistingPickBits & { weekNumber: number }>;
};

function pickFor(member: EnterPickMemberBits, week: number): ExistingPickBits {
  return member.picks.find((p) => p.weekNumber === week) ?? null;
}

/** Past + current always. Next week only when that friend’s pick unlocks. */
export function allowedEnterPickWeeks(opts: {
  currentWeek: number;
  weeks: EnterPickWeekBits[];
  member: EnterPickMemberBits;
  now?: Date;
}): number[] {
  const current = opts.weeks.find((w) => w.number === opts.currentWeek);
  const nextNum = opts.currentWeek + 1;
  const next = opts.weeks.find((w) => w.number === nextNum);
  const currentPick = pickFor(opts.member, opts.currentWeek);
  const nextPick = pickFor(opts.member, nextNum);
  const decision = resolvePlayerPickWeek({
    poolCurrentWeek: opts.currentWeek,
    currentWeekLocked: current?.locked ?? false,
    existingCurrentPick: currentPick,
    existingCurrentGame: gameForPick(currentPick, current?.games ?? []),
    playingFromWeek: opts.member.playingFromWeek,
    nextWeekHasGames: Boolean(next && next.games.length > 0),
    nextWeekLocked: next?.locked ?? false,
    existingNextPick: nextPick,
    existingNextGame: gameForPick(nextPick, next?.games ?? []),
    now: opts.now,
  });
  const offerNext =
    Boolean(next && next.games.length > 0) &&
    (decision.nextWeekOpen ||
      isPlayerPickWeek(decision, nextNum) ||
      isUserPick(nextPick));
  return opts.weeks
    .filter((w) => w.games.length > 0)
    .map((w) => w.number)
    .filter((n) => n <= opts.currentWeek || (offerNext && n === nextNum))
    .sort((a, b) => a - b);
}
