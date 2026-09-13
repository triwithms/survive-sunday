/** Same sentinel as grading.MISSED_TEAM — kept local so this module stays DB-free. */
const MISSED_TEAM = "MISS";

/** Week-1-only reopen after the week lock (first kickoff). Weeks 2+ stay locked. */
export const WEEK1_PICK_CHANGE_WEEK = 1;

export type GameStartBits = {
  id?: string | null;
  status?: string | null;
  kickoff?: Date | string | number | null;
  awayAbbr?: string | null;
  homeAbbr?: string | null;
};

export type ExistingPickBits = {
  source?: string | null;
  teamAbbr?: string | null;
  gameId?: string | null;
  result?: string | null;
} | null;

export type PickChangeReason =
  | "week_open"
  | "week1_reopen"
  | "week_locked"
  | "current_game_started"
  | "new_game_started";

export type PickChangeDecision = {
  allowed: boolean;
  reason: PickChangeReason;
};

export function week1PickChangeApplies(weekNumber: number): boolean {
  return weekNumber === WEEK1_PICK_CHANGE_WEEK;
}

export function isUserPick(
  pick: ExistingPickBits | undefined
): pick is NonNullable<ExistingPickBits> {
  if (!pick) return false;
  if (pick.source === "missed") return false;
  if (!pick.teamAbbr || pick.teamAbbr === MISSED_TEAM) return false;
  return true;
}

export function isPendingUserPick(
  pick: ExistingPickBits | undefined
): boolean {
  if (!isUserPick(pick)) return false;
  const result = pick.result;
  return result == null || result === "pending";
}

/** Live / final, or kickoff time already reached (ESPN status can lag). */
export function isGameStarted(
  game: GameStartBits | null | undefined,
  now: Date = new Date()
): boolean {
  if (!game) return false;
  const status = (game.status ?? "").toLowerCase();
  if (status === "live" || status === "final") return true;
  if (game.kickoff == null || game.kickoff === "") return false;
  const kickoff =
    game.kickoff instanceof Date ? game.kickoff : new Date(game.kickoff);
  if (Number.isNaN(kickoff.getTime())) return false;
  return now.getTime() >= kickoff.getTime();
}

export function gameForPick<
  T extends {
    id: string;
    awayAbbr: string;
    homeAbbr: string;
  },
>(
  pick: ExistingPickBits | undefined,
  games: T[]
): T | null {
  if (!pick) return null;
  if (pick.gameId) {
    const byId = games.find((game) => game.id === pick.gameId);
    if (byId) return byId;
  }
  if (pick.teamAbbr) {
    return (
      games.find(
        (game) =>
          game.awayAbbr === pick.teamAbbr || game.homeAbbr === pick.teamAbbr
      ) ?? null
    );
  }
  return null;
}

/**
 * Whether an existing pick may still be edited.
 * Before week lock: yes. After lock: Week 1 only, pending pick, game not started.
 */
export function canEditExistingPick(input: {
  weekNumber: number;
  weekLocked: boolean;
  existingPick: ExistingPickBits | undefined;
  existingGame: GameStartBits | null | undefined;
  now?: Date;
}): boolean {
  if (!input.weekLocked) return true;
  if (!week1PickChangeApplies(input.weekNumber)) return false;
  if (!isPendingUserPick(input.existingPick)) return false;
  if (!input.existingGame) return false;
  return !isGameStarted(input.existingGame, input.now ?? new Date());
}

/**
 * Submit / change decision. Does not cover auth, used-teams, bye, or current-week.
 * First pick after lock stays blocked (missed-pick path). Week 1 only reopens
 * an existing pending pick when both games are still scheduled / not started.
 */
export function evaluatePickChange(input: {
  weekNumber: number;
  weekLocked: boolean;
  existingPick: ExistingPickBits | undefined;
  existingGame: GameStartBits | null | undefined;
  newGame: GameStartBits | null | undefined;
  now?: Date;
}): PickChangeDecision {
  const now = input.now ?? new Date();

  if (!input.weekLocked) {
    return { allowed: true, reason: "week_open" };
  }

  if (!week1PickChangeApplies(input.weekNumber)) {
    return { allowed: false, reason: "week_locked" };
  }

  if (!isPendingUserPick(input.existingPick)) {
    return { allowed: false, reason: "week_locked" };
  }

  if (!input.existingGame || isGameStarted(input.existingGame, now)) {
    return { allowed: false, reason: "current_game_started" };
  }

  if (!input.newGame || isGameStarted(input.newGame, now)) {
    return { allowed: false, reason: "new_game_started" };
  }

  return { allowed: true, reason: "week1_reopen" };
}

export function pickChangeErrorMessage(reason: PickChangeReason): string {
  switch (reason) {
    case "current_game_started":
      return "Your pick’s game has started — you can’t change it";
    case "new_game_started":
      return "That game has already started";
    case "week_locked":
      return "Week is locked — picks cannot change";
    default:
      return "Week is locked — picks cannot change";
  }
}

export function playerCanChangeCurrentPick(input: {
  weekNumber: number;
  weekLocked: boolean;
  eliminated: boolean;
  isPlayer: boolean;
  existingPick: ExistingPickBits | undefined;
  existingGame: GameStartBits | null | undefined;
  now?: Date;
}): boolean {
  if (!input.isPlayer || input.eliminated) return false;
  return canEditExistingPick(input);
}
