import { isGameStarted, week1PickChangeApplies } from "./pick-change";

/** Copy a source member’s pick this far before the relevant deadline. */
export const MIRROR_LEAD_MS = 30 * 60 * 1000;
/** Auto-pick the best remaining 2025-rank team this far before week lock. */
export const RANK_LEAD_MS = 2 * 60 * 1000;

export const PICK_BACKUP_OFF = "off";
export const PICK_BACKUP_MIRROR = "mirror";
export const PICK_BACKUP_RANKED = "ranked";
export type PickBackupMode =
  | typeof PICK_BACKUP_OFF
  | typeof PICK_BACKUP_MIRROR
  | typeof PICK_BACKUP_RANKED;

/** Pick.source value for auto-copied backup picks. */
export const MIRROR_PICK_SOURCE = "mirrored";
/** Pick.source value for auto 2025-rank backups. */
export const RANKED_PICK_SOURCE = "ranked";

const MISSED_TEAM = "MISS";

export function isPickBackupMode(value: unknown): value is PickBackupMode {
  return (
    value === PICK_BACKUP_OFF ||
    value === PICK_BACKUP_MIRROR ||
    value === PICK_BACKUP_RANKED
  );
}

/** Leftover mirrorFrom without pickBackup still means “copy from member.” */
export function resolvePickBackupMode(
  mode: string | null | undefined,
  mirrorFromMembershipId: string | null | undefined
): PickBackupMode {
  if (mode === PICK_BACKUP_RANKED) return PICK_BACKUP_RANKED;
  if (mode === PICK_BACKUP_MIRROR) return PICK_BACKUP_MIRROR;
  if (mirrorFromMembershipId) return PICK_BACKUP_MIRROR;
  return PICK_BACKUP_OFF;
}

export type MirrorSkipReason =
  | "no_source_set"
  | "self"
  | "eliminated"
  | "has_pick"
  | "source_no_pick"
  | "too_early"
  | "team_used"
  | "team_not_playing";

export type MirrorDecision =
  | { action: "copy"; teamAbbr: string }
  | { action: "skip"; reason: MirrorSkipReason };

export type MirrorExistingPick = {
  source?: string | null;
  teamAbbr?: string | null;
} | null;

/**
 * Deadline that would lock *this* copied pick.
 * Week 1: the source pick’s game kickoff (e.g. KC Monday night).
 * Weeks 2+: week lock (first kickoff) — a first pick must exist by then.
 */
export function relevantMirrorDeadline(input: {
  weekNumber: number;
  weekLockAt: Date;
  sourceGameKickoff: Date | null;
}): Date {
  const kick = input.sourceGameKickoff;
  if (!kick) return input.weekLockAt;
  if (week1PickChangeApplies(input.weekNumber)) return kick;
  return input.weekLockAt.getTime() <= kick.getTime()
    ? input.weekLockAt
    : kick;
}

/** True from 30 minutes before the deadline onward (including after). */
export function isMirrorWindowOpen(deadline: Date, now: Date): boolean {
  return now.getTime() >= deadline.getTime() - MIRROR_LEAD_MS;
}

/** Any existing pick row (including a miss) — do not overwrite. */
export function hasOwnPick(pick: MirrorExistingPick | undefined): boolean {
  return pick != null;
}

export function decideMirrorCopy(input: {
  now: Date;
  weekNumber: number;
  weekLockAt: Date;
  existingPick: MirrorExistingPick;
  sourceMembershipId: string | null | undefined;
  memberId: string;
  sourcePick: { teamAbbr: string; gameKickoff: Date | null } | null;
  usedTeams: string[];
  teamPlaying: boolean;
  eliminated: boolean;
}): MirrorDecision {
  if (input.eliminated) return { action: "skip", reason: "eliminated" };
  if (!input.sourceMembershipId) {
    return { action: "skip", reason: "no_source_set" };
  }
  if (input.sourceMembershipId === input.memberId) {
    return { action: "skip", reason: "self" };
  }
  if (hasOwnPick(input.existingPick)) {
    return { action: "skip", reason: "has_pick" };
  }
  if (!input.sourcePick?.teamAbbr) {
    return { action: "skip", reason: "source_no_pick" };
  }

  const deadline = relevantMirrorDeadline({
    weekNumber: input.weekNumber,
    weekLockAt: input.weekLockAt,
    sourceGameKickoff: input.sourcePick.gameKickoff,
  });
  if (!isMirrorWindowOpen(deadline, input.now)) {
    return { action: "skip", reason: "too_early" };
  }

  const teamAbbr = input.sourcePick.teamAbbr.toUpperCase();
  if (teamAbbr === MISSED_TEAM) {
    return { action: "skip", reason: "source_no_pick" };
  }
  if (!input.teamPlaying) {
    return { action: "skip", reason: "team_not_playing" };
  }
  if (input.usedTeams.includes(teamAbbr)) {
    return { action: "skip", reason: "team_used" };
  }

  return { action: "copy", teamAbbr };
}

/** True from 2 minutes before week lock onward (including after). */
export function isRankedWindowOpen(deadline: Date, now: Date): boolean {
  return now.getTime() >= deadline.getTime() - RANK_LEAD_MS;
}

export type RankedTeam = { abbr: string; priorYearRank: number | null };
export type RankedGame = {
  awayAbbr: string;
  homeAbbr: string;
  kickoff?: Date | string | number | null;
  status?: string | null;
};

/**
 * Highest 2025 composite power rank still available (1 = strongest).
 * Same ranking Pick shows as “2025 rank #N”. Skips used teams and byes.
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

export function decideRankedAutoPick(input: {
  now: Date;
  weekLockAt: Date;
  existingPick: MirrorExistingPick;
  eliminated: boolean;
  teamAbbr: string | null;
}): MirrorDecision {
  if (input.eliminated) return { action: "skip", reason: "eliminated" };
  if (hasOwnPick(input.existingPick)) {
    return { action: "skip", reason: "has_pick" };
  }
  if (!isRankedWindowOpen(input.weekLockAt, input.now)) {
    return { action: "skip", reason: "too_early" };
  }
  if (!input.teamAbbr) {
    return { action: "skip", reason: "team_not_playing" };
  }
  return { action: "copy", teamAbbr: input.teamAbbr };
}
