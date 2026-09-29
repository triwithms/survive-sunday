/** Attach shared NFL games onto a pool's own week shells. Pure. */

export function overlayGamesByNumber<T extends { number: number; games: unknown[] }>(
  weeks: T[],
  slate: Map<number, T["games"]> | null
): T[] {
  if (!slate) return weeks;
  return weeks.map((week) => {
    if (week.games.length > 0) return week;
    const games = slate.get(week.number);
    if (!games || games.length === 0) return week;
    return { ...week, games };
  });
}
