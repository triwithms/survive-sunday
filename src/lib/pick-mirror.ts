import { week1PickChangeApplies } from "./pick-change";

/** Copy a source member’s pick this far before the relevant deadline. */
export const MIRROR_LEAD_MS = 30 * 60 * 1000;

/** Pick.source value for auto-copied backup picks. */
export const MIRROR_PICK_SOURCE = "mirrored";

const MISSED_TEAM = "MISS";

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
