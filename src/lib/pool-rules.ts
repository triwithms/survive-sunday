/** Pool-level survival rules. Pure helpers — no database. */

export type LossDecision = {
  status: "one_loss" | "eliminated";
  mulliganRemaining: boolean;
  burnedMulligan: boolean;
};

export function isSingleEliminationWeek(
  singleEliminationFromWeek: number | null | undefined,
  weekNumber: number
): boolean {
  return (
    singleEliminationFromWeek != null &&
    weekNumber >= singleEliminationFromWeek
  );
}

/**
 * First loss burns the mulligan → one_loss, unless this week is one-and-done.
 * Already-eliminated members are left alone.
 */
export function decideStatusAfterLoss(args: {
  currentStatus: string;
  mulliganRemaining: boolean;
  weekNumber: number;
  singleEliminationFromWeek: number | null | undefined;
}):
  | { unchanged: true; status: string; mulliganRemaining: boolean }
  | (LossDecision & { unchanged?: false }) {
  if (args.currentStatus === "eliminated") {
    return {
      unchanged: true,
      status: "eliminated",
      mulliganRemaining: args.mulliganRemaining,
    };
  }

  const oneAndDone = isSingleEliminationWeek(
    args.singleEliminationFromWeek,
    args.weekNumber
  );

  if (args.mulliganRemaining && !oneAndDone) {
    return {
      status: "one_loss",
      mulliganRemaining: false,
      burnedMulligan: true,
    };
  }

  return {
    status: "eliminated",
    // Do not pretend they used a mulligan they were not allowed to use
    mulliganRemaining: args.mulliganRemaining,
    burnedMulligan: false,
  };
}

export function poolRulesPlayerLabel(
  singleEliminationFromWeek: number | null | undefined
): string | null {
  if (singleEliminationFromWeek == null) return null;
  return `From Week ${singleEliminationFromWeek}: no mulligan / one-and-done.`;
}

export function poolRulesAdminSummary(
  singleEliminationFromWeek: number | null | undefined
): string {
  if (singleEliminationFromWeek == null) {
    return "Everyone gets one free mulligan. First loss keeps them in with one loss. Second loss puts them out.";
  }
  return `From Week ${singleEliminationFromWeek} onward, there is no free mulligan. One loss (or a missed pick) puts a player out.`;
}

export function isPoolParticipant(member: {
  isParticipant?: boolean;
  role?: string;
}): boolean {
  // Dual-role spectator commissioner seat (role=admin) is never on the board.
  if (member.role === "admin") return false;
  if (typeof member.isParticipant === "boolean") return member.isParticipant;
  return true;
}

export function shouldApplyMissedPick(
  member: {
    isParticipant?: boolean;
    role?: string;
    status: string;
    playingFromWeek?: number | null;
  },
  weekNumber: number
): boolean {
  if (!isPoolParticipant(member)) return false;
  if (member.status === "eliminated") return false;
  if (
    member.playingFromWeek != null &&
    weekNumber < member.playingFromWeek
  ) {
    return false;
  }
  return true;
}

/** First week a new player (or former spectator) can take a missed-pick loss. */
export function nextPlayingWeek(args: {
  currentWeek: number;
  weekLocked: boolean;
}): number {
  return args.weekLocked ? args.currentWeek + 1 : args.currentWeek;
}

export function nicknamesMatch(a: string, b: string): boolean {
  return a.trim().localeCompare(b.trim(), "en-CA", { sensitivity: "accent" }) === 0;
}

export function parseSingleEliminationWeek(
  value: unknown
): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 18) return undefined;
  return n;
}
