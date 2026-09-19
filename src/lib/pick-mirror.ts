import {
  bestRemainingRankedTeam,
  type RankedGame,
  type RankedTeam,
} from "./pick-rank-team";

export { bestRemainingRankedTeam };
export type { RankedGame, RankedTeam };

/** Ranked auto this far before kickoff / week lock. */
export const RANK_LEAD_MS = 5 * 60 * 1000;

export const PICK_BACKUP_OFF = "off";
export const PICK_BACKUP_RANKED = "ranked";
export type PickBackupMode =
  | typeof PICK_BACKUP_OFF
  | typeof PICK_BACKUP_RANKED;

export const RANKED_PICK_SOURCE = "ranked";
/** Historic copy-from pick.source — never stamps 💩. */
export const MIRROR_PICK_SOURCE = "mirrored";

export function isPickBackupMode(value: unknown): value is PickBackupMode {
  return value === PICK_BACKUP_OFF || value === PICK_BACKUP_RANKED;
}

/** Off stays Off. Leftover copy-from / unknown → ranked auto. */
export function resolvePickBackupMode(
  mode: string | null | undefined,
  mirrorFromMembershipId?: string | null
): PickBackupMode {
  if (mode === PICK_BACKUP_OFF && !mirrorFromMembershipId) {
    return PICK_BACKUP_OFF;
  }
  return PICK_BACKUP_RANKED;
}

export type MirrorSkipReason =
  | "eliminated"
  | "has_pick"
  | "too_early"
  | "team_not_playing";

export type MirrorDecision =
  | { action: "copy"; teamAbbr: string }
  | { action: "skip"; reason: MirrorSkipReason };

export type MirrorExistingPick = {
  source?: string | null;
  teamAbbr?: string | null;
} | null;

/** Any existing pick row (including a miss) — do not overwrite. */
export function hasOwnPick(pick: MirrorExistingPick | undefined): boolean {
  return pick != null;
}

/** True from ~5 minutes before the deadline onward (including after). */
export function isRankedWindowOpen(deadline: Date, now: Date): boolean {
  return now.getTime() >= deadline.getTime() - RANK_LEAD_MS;
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
