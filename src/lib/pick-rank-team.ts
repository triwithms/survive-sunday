import { isGameStarted } from "./pick-change";

export type RankedTeam = { abbr: string; priorYearRank: number | null };
export type RankedGame = {
  awayAbbr: string;
  homeAbbr: string;
  kickoff?: Date | string | number | null;
  status?: string | null;
};

/**
 * Highest 2025 composite power rank still available (1 = strongest).
 * Same list Pick shows as “2025 rank #N”. Skips used teams and byes.
 * Prefers a game that has not started; then best remaining by rank.
 */
export function bestRemainingRankedTeam(input: {
  games: RankedGame[];
  usedTeams: string[];
  ranks: RankedTeam[];
  now: Date;
}): { teamAbbr: string; priorYearRank: number | null } | null {
  const used = new Set(input.usedTeams.map((t) => t.toUpperCase()));
  const rankBy = new Map(
    input.ranks.map((t) => [t.abbr.toUpperCase(), t.priorYearRank] as const)
  );
  const seen = new Set<string>();
  const cands: { abbr: string; rank: number; started: boolean }[] = [];
  for (const game of input.games) {
    for (const raw of [game.awayAbbr, game.homeAbbr]) {
      const abbr = raw.toUpperCase();
      if (seen.has(abbr) || used.has(abbr)) continue;
      seen.add(abbr);
      cands.push({
        abbr,
        rank: rankBy.get(abbr) ?? 999,
        started: isGameStarted(game, input.now),
      });
    }
  }
  cands.sort((a, b) => {
    if (a.started !== b.started) return a.started ? 1 : -1;
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.abbr.localeCompare(b.abbr, "en-CA");
  });
  const best = cands[0];
  if (!best) return null;
  return {
    teamAbbr: best.abbr,
    priorYearRank: best.rank === 999 ? null : best.rank,
  };
}
