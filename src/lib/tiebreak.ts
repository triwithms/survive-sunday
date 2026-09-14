import { isOfficialWinnerEligible } from "./auto-pick-stamps";

/**
 * Season-end tiebreak helpers (en-CA).
 * Official winner must have a clean season (no ranked auto-pick 💩).
 * Copy-from-member does not stamp. Prefer sole survivor among eligible
 * players. If multiple remain eligible after Week 18:
 * 1. Fewest losses
 * 2. Most weeks survived
 * 3. Still tied → shared win (co-champions). Nickname A–Z is display order only —
 *    never used to crown a sole winner.
 * Optional backup (commissioner / offline): one extra pick week among tied players only.
 */

export type AliveMember = {
  nickname: string;
  status: string;
  losses: number;
  weeksSurvived: number;
  /** Ranked leftover auto-picks this season. Official winners must be 0. */
  autoPickStamps?: number | null;
};

export function isAlive(status: string): boolean {
  return status === "undefeated" || status === "one_loss";
}

/** Player-facing Survival board / standings list (not season-end crowning). */
export type BoardMember = {
  status: string;
  nickname: string;
  weeksSurvived: number;
  losses: number;
  /** Current-week pick abbr. Empty / missed / pending-without-team sort last. */
  pickTeamAbbr?: string | null;
  /** Kickoff of the pick’s game (schedule order). Missing games sort last. */
  pickGameKickoff?: Date | string | number | null;
};

export type BoardPickSource = {
  teamAbbr?: string | null;
  source?: string | null;
  gameId?: string | null;
  game?: { kickoff?: Date | string | number | null } | null;
};

export type BoardGameSource = {
  id?: string;
  kickoff: Date | string | number;
  awayAbbr?: string;
  homeAbbr?: string;
};

const MISSED_PICK_TEAM = "MISS";

function boardPickTeam(member: BoardMember): string | null {
  const abbr = member.pickTeamAbbr?.trim().toUpperCase() ?? "";
  if (!abbr || abbr === MISSED_PICK_TEAM) return null;
  return abbr;
}

function boardKickoffMs(member: BoardMember): number {
  const value = member.pickGameKickoff;
  if (value == null) return Number.POSITIVE_INFINITY;
  const t = typeof value === "number" ? value : new Date(value).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

/** Attach current-week pick + game kickoff used by the Survival board sort. */
export function boardPickFields(
  pick?: BoardPickSource | null,
  games: BoardGameSource[] = []
): { pickTeamAbbr: string | null; pickGameKickoff: Date | string | number | null } {
  const abbr = pick?.teamAbbr?.trim().toUpperCase() ?? "";
  if (!pick || !abbr || pick.source === "missed" || abbr === MISSED_PICK_TEAM) {
    return { pickTeamAbbr: null, pickGameKickoff: null };
  }
  if (pick.game?.kickoff != null) {
    return { pickTeamAbbr: abbr, pickGameKickoff: pick.game.kickoff };
  }
  const match = games.find(
    (g) =>
      (pick.gameId && g.id === pick.gameId) ||
      g.awayAbbr === abbr ||
      g.homeAbbr === abbr
  );
  return { pickTeamAbbr: abbr, pickGameKickoff: match?.kickoff ?? null };
}

/**
 * Player-facing board order — reuse anywhere a week’s participant picks
 * are listed (Board, Home/Pool, Scores, week picks API):
 * 1. Status: undefeated → one_loss → eliminated
 * 2. weeksSurvived descending
 * 3. losses ascending
 * 4. Same current-week pick team (no-pick / pending-without-team last)
 * 5. Same game (earlier kickoff first) when pick teams differ
 * 6. Nickname A–Z
 */
export function sortParticipants<T extends BoardMember>(members: T[]): T[] {
  const order: Record<string, number> = {
    undefeated: 0,
    one_loss: 1,
    eliminated: 2,
  };
  return [...members].sort((a, b) => {
    const sa = order[a.status] ?? 9;
    const sb = order[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    if (a.weeksSurvived !== b.weeksSurvived)
      return b.weeksSurvived - a.weeksSurvived;
    if (a.losses !== b.losses) return a.losses - b.losses;

    const teamA = boardPickTeam(a);
    const teamB = boardPickTeam(b);
    if (teamA !== teamB) {
      if (!teamA) return 1;
      if (!teamB) return -1;
      const ka = boardKickoffMs(a);
      const kb = boardKickoffMs(b);
      if (ka !== kb) return ka - kb;
      return teamA.localeCompare(teamB, "en-CA");
    }

    return a.nickname.localeCompare(b.nickname, "en-CA");
  });
}

export function resolveSeasonWinners(alive: AliveMember[]): {
  sole: AliveMember | null;
  shared: AliveMember[];
  ranked: AliveMember[];
  officialEligible: AliveMember[];
} {
  const living = alive.filter((m) => isAlive(m.status));
  const officialEligible = living.filter((m) =>
    isOfficialWinnerEligible(m.autoPickStamps)
  );
  if (officialEligible.length === 0) {
    return { sole: null, shared: [], ranked: living, officialEligible };
  }
  const ranked = [...officialEligible].sort((a, b) => {
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (a.weeksSurvived !== b.weeksSurvived)
      return b.weeksSurvived - a.weeksSurvived;
    return a.nickname.localeCompare(b.nickname, "en-CA");
  });
  if (ranked.length === 1) {
    return { sole: ranked[0], shared: [], ranked, officialEligible };
  }
  const best = ranked[0];
  const tied = ranked.filter(
    (m) =>
      m.losses === best.losses && m.weeksSurvived === best.weeksSurvived
  );
  if (tied.length === 1) {
    return { sole: tied[0], shared: [], ranked, officialEligible };
  }
  return { sole: null, shared: tied, ranked, officialEligible };
}
