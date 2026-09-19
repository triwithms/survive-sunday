export type MarginGame = {
  awayAbbr: string;
  homeAbbr: string;
  scoreAway: number | null;
  scoreHome: number | null;
  status?: string | null;
};

export type MarginPick = {
  membershipId: string;
  teamAbbr: string;
  result?: string | null;
  game?: MarginGame | null;
};

function scoreMargin(teamAbbr: string, game: MarginGame): number | null {
  if (game.scoreAway == null || game.scoreHome == null) return null;
  const abbr = teamAbbr.trim().toUpperCase();
  if (game.homeAbbr === abbr) return game.scoreHome - game.scoreAway;
  if (game.awayAbbr === abbr) return game.scoreAway - game.scoreHome;
  return null;
}

/** Winning graded pick, or a final the pick already won (grade lag). */
export function pickWinMargin(pick: Omit<MarginPick, "membershipId">): number {
  const game = pick.game;
  if (!game) return 0;
  const margin = scoreMargin(pick.teamAbbr, game);
  if (margin == null) return 0;
  if (pick.result === "win") return margin;
  if (game.status === "final" && margin > 0) return margin;
  return 0;
}

export function winMarginByMember(picks: MarginPick[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const pick of picks) {
    const next = (totals.get(pick.membershipId) ?? 0) + pickWinMargin(pick);
    totals.set(pick.membershipId, next);
  }
  return totals;
}
