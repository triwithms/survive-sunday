import { isGameStarted } from "./pick-change";
import { REAL_CURRENT_WEEK } from "./pool-mode";

export type PoolSlateGame = {
  status?: string | null;
  kickoff?: Date | string | number | null;
};

export type PoolSlateWeek = {
  number: number;
  games: PoolSlateGame[];
};

function weekIsComplete(week: PoolSlateWeek): boolean {
  return (
    week.games.length > 0 &&
    week.games.every((game) => (game.status ?? "").toLowerCase() === "final")
  );
}

function weekHasStarted(week: PoolSlateWeek, now: Date): boolean {
  return week.games.some((game) => isGameStarted(game, now));
}

/**
 * Pool board week from the stored value, catching up when the slate moved on.
 * Never follows a player's next-pick / action week. Never goes backward.
 */
export function derivePoolCurrentWeek(
  storedWeek: number,
  weeks: PoolSlateWeek[],
  now: Date = new Date()
): number {
  const stored = storedWeek >= 1 ? storedWeek : REAL_CURRENT_WEEK;
  const byNumber = new Map(weeks.map((week) => [week.number, week]));
  let current = stored;

  while (true) {
    const week = byNumber.get(current);
    const next = byNumber.get(current + 1);
    if (!next || next.games.length === 0) break;
    const finished = week ? weekIsComplete(week) : false;
    if (finished || weekHasStarted(next, now)) {
      current += 1;
      continue;
    }
    break;
  }
  return current;
}

export function shouldAdvanceStoredWeek(
  storedWeek: number,
  derivedWeek: number
): boolean {
  return derivedWeek > storedWeek && storedWeek >= 1;
}
