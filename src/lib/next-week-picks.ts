/**
 * Per-player next-week pick unlock.
 *
 * Pool current week (Real mode = Week 1) stays the group board week.
 * A player’s *next* week opens as soon as *their* current-week pick is
 * locked (that game has started) — not after Monday Night Football.
 * New joiners with no current-week pick path go straight to the next week.
 */
import {
  canEditExistingPick,
  gameForPick,
  isUserPick,
  type ExistingPickBits,
  type GameStartBits,
} from "./pick-change";

export type PlayerPickWeekReason =
  | "current_week_open"
  | "current_game_pending"
  | "current_pick_locked"
  | "current_week_closed"
  | "late_start"
  | "slate_not_ready"
  | "next_week_locked";

export type PlayerPickWeek = {
  poolCurrentWeek: number;
  nextWeek: number;
  /** Week the Pick screen should open on. */
  actionWeek: number;
  /** True while they can still submit or change the pool’s current week. */
  canStillPlayCurrentWeek: boolean;
  /** True when they may submit the next week (slate is ready and unlocked). */
  nextWeekOpen: boolean;
  slateReady: boolean;
  reason: PlayerPickWeekReason;
};

export function isEligibleForPlayingWeek(
  playingFromWeek: number | null | undefined,
  weekNumber: number
): boolean {
  if (playingFromWeek == null) return true;
  return weekNumber >= playingFromWeek;
}

export function resolvePlayerPickWeek(input: {
  poolCurrentWeek: number;
  currentWeekLocked: boolean;
  existingCurrentPick: ExistingPickBits;
  existingCurrentGame: GameStartBits | null | undefined;
  playingFromWeek?: number | null;
  nextWeekHasGames: boolean;
  nextWeekLocked: boolean;
  now?: Date;
}): PlayerPickWeek {
  const now = input.now ?? new Date();
  const poolCurrentWeek = input.poolCurrentWeek;
  const nextWeek = poolCurrentWeek + 1;
  const eligibleNow = isEligibleForPlayingWeek(
    input.playingFromWeek,
    poolCurrentWeek
  );

  const canStillPlayCurrentWeek =
    eligibleNow &&
    canEditExistingPick({
      weekNumber: poolCurrentWeek,
      weekLocked: input.currentWeekLocked,
      existingPick: input.existingCurrentPick,
      existingGame: input.existingCurrentGame,
      now,
    });

  const currentPickLocked =
    eligibleNow &&
    input.currentWeekLocked &&
    isUserPick(input.existingCurrentPick) &&
    !canStillPlayCurrentWeek;
  const lateStart = !eligibleNow;

  const base = {
    poolCurrentWeek,
    nextWeek,
    canStillPlayCurrentWeek,
    slateReady: input.nextWeekHasGames,
  };

  if (canStillPlayCurrentWeek) {
    return {
      ...base,
      actionWeek: poolCurrentWeek,
      nextWeekOpen: false,
      reason: input.currentWeekLocked
        ? "current_game_pending"
        : "current_week_open",
    };
  }

  if (input.nextWeekLocked) {
    return {
      ...base,
      actionWeek: poolCurrentWeek,
      nextWeekOpen: false,
      reason: "next_week_locked",
    };
  }

  if (!input.nextWeekHasGames) {
    return {
      ...base,
      actionWeek: nextWeek,
      nextWeekOpen: false,
      reason: "slate_not_ready",
    };
  }

  return {
    ...base,
    actionWeek: nextWeek,
    nextWeekOpen: true,
    reason: lateStart
      ? "late_start"
      : currentPickLocked
        ? "current_pick_locked"
        : "current_week_closed",
  };
}

export function isPlayerPickWeek(
  decision: PlayerPickWeek,
  weekNumber: number
): boolean {
  if (
    weekNumber === decision.poolCurrentWeek &&
    decision.canStillPlayCurrentWeek
  ) {
    return true;
  }
  if (weekNumber === decision.nextWeek && decision.nextWeekOpen) {
    return true;
  }
  return false;
}

export function playerPickWeekError(
  decision: PlayerPickWeek,
  weekNumber: number
): string {
  if (isPlayerPickWeek(decision, weekNumber)) return "";
  if (
    weekNumber === decision.nextWeek &&
    decision.reason === "current_game_pending"
  ) {
    return `Week ${decision.nextWeek} opens after your Week ${decision.poolCurrentWeek} game starts`;
  }
  if (
    weekNumber === decision.nextWeek &&
    decision.reason === "slate_not_ready"
  ) {
    return `Week ${decision.nextWeek} games aren’t listed yet — check back soon`;
  }
  if (
    weekNumber === decision.poolCurrentWeek &&
    decision.nextWeekOpen
  ) {
    return `Week ${decision.poolCurrentWeek} is closed for you — Week ${decision.nextWeek} is open`;
  }
  return `You can only pick Week ${decision.actionWeek} right now`;
}

export function nextWeekOpenHeadline(
  weekNumber: number,
  slateReady: boolean
): string {
  if (!slateReady) {
    return `Week ${weekNumber} games aren’t listed yet — check back soon.`;
  }
  return `Week ${weekNumber} is open — make your pick`;
}

export function pickHrefForWeek(weekNumber: number): string {
  return `/pick?week=${weekNumber}`;
}

export type PickScreenBanner = {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
};

export type PickScreenCopy = {
  kicker: string;
  banner: PickScreenBanner | null;
  showWeek1ChangeCard: boolean;
  showDismissibleTip: boolean;
};

/**
 * Calm Pick-screen copy. At most one banner so the slate stays uncluttered.
 */
export function pickScreenCopy(input: {
  weekNumber: number;
  decision: PlayerPickWeek;
  locked: boolean;
  canChange: boolean;
  eliminated: boolean;
  spectator: boolean;
  hasCurrentPick: boolean;
}): PickScreenCopy {
  const { weekNumber, decision, locked, canChange, eliminated, spectator } =
    input;
  const nextLabel = nextWeekOpenHeadline(decision.nextWeek, decision.slateReady);

  if (eliminated) {
    return {
      kicker: "You're eliminated — matchups are read-only.",
      banner: null,
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }
  if (spectator) {
    return {
      kicker: "Commissioner view — no pick required.",
      banner: null,
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  const onActionWeek = weekNumber === decision.actionWeek;
  const onCurrent = weekNumber === decision.poolCurrentWeek;
  const onNext = weekNumber === decision.nextWeek;
  const week1Pending =
    onCurrent && decision.reason === "current_game_pending" && canChange;

  if (week1Pending) {
    return {
      kicker:
        "Week 1 only: you can change your pick until that team’s kickoff. After Week 1 this goes away.",
      banner: null,
      showWeek1ChangeCard: true,
      showDismissibleTip: false,
    };
  }

  if (onActionWeek && decision.reason === "slate_not_ready") {
    return {
      kicker: nextLabel,
      banner: {
        title: `Week ${decision.nextWeek} isn’t listed yet`,
        body: "The next week’s games will show here as soon as the slate is ready. No need to wait for Monday Night Football.",
      },
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  if (onActionWeek && decision.nextWeekOpen && canChange) {
    return {
      kicker: nextLabel,
      banner: null,
      showWeek1ChangeCard: false,
      showDismissibleTip: true,
    };
  }

  if (onActionWeek && decision.canStillPlayCurrentWeek && canChange) {
    return {
      kicker: "Use Pick on a side to choose that team. One team. No reuse.",
      banner: null,
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  if (onCurrent && decision.nextWeekOpen) {
    return {
      kicker: input.hasCurrentPick
        ? `Your Week ${decision.poolCurrentWeek} pick is locked.`
        : `Week ${decision.poolCurrentWeek} is closed for you.`,
      banner: {
        title: nextLabel,
        body: "Your next pick is ready now. You don’t wait for Monday Night Football.",
        href: pickHrefForWeek(decision.nextWeek),
        hrefLabel: `Go to Week ${decision.nextWeek}`,
      },
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  if (onNext && !decision.nextWeekOpen && decision.canStillPlayCurrentWeek) {
    return {
      kicker: `Browsing Week ${weekNumber} — picks open on Week ${decision.poolCurrentWeek}.`,
      banner: {
        title: `Week ${weekNumber} isn’t open for picks yet`,
        body: `This week opens after your Week ${decision.poolCurrentWeek} game starts.`,
        href: pickHrefForWeek(decision.poolCurrentWeek),
        hrefLabel: `Back to Week ${decision.poolCurrentWeek}`,
      },
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  if (weekNumber > decision.actionWeek) {
    return {
      kicker: `Browsing Week ${weekNumber} — picks open on Week ${decision.actionWeek}.`,
      banner: {
        title: `Week ${weekNumber} isn’t open for picks yet`,
        body: `Make this week’s pick on Week ${decision.actionWeek}.`,
        href: pickHrefForWeek(decision.actionWeek),
        hrefLabel: `Go to Week ${decision.actionWeek}`,
      },
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  if (weekNumber < decision.actionWeek) {
    return {
      kicker: `Week ${weekNumber} is over — this pick is read-only.`,
      banner: decision.nextWeekOpen
        ? {
            title: nextLabel,
            body: "Your next pick is ready now.",
            href: pickHrefForWeek(decision.nextWeek),
            hrefLabel: `Go to Week ${decision.nextWeek}`,
          }
        : null,
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  if (locked && !canChange) {
    return {
      kicker: "Week locked — picks are read-only.",
      banner: {
        title: `Week ${weekNumber} is locked (season in progress).`,
        body: "Picks cannot change. The commissioner can reopen the week from the Admin page (“Reopen week for picks”).",
      },
      showWeek1ChangeCard: false,
      showDismissibleTip: false,
    };
  }

  return {
    kicker: canChange
      ? "Use Pick on a side to choose that team. One team. No reuse."
      : "This week’s pick is read-only.",
    banner: null,
    showWeek1ChangeCard: false,
    showDismissibleTip: false,
  };
}

export function homeEmptyPickCopy(decision: PlayerPickWeek): {
  message: string;
  ctaLabel: string | null;
  href: string | null;
  missed: boolean;
} {
  if (decision.nextWeekOpen || decision.reason === "slate_not_ready") {
    return {
      message: nextWeekOpenHeadline(decision.nextWeek, decision.slateReady),
      ctaLabel: decision.nextWeekOpen ? "Make your pick" : null,
      href: decision.nextWeekOpen ? pickHrefForWeek(decision.nextWeek) : null,
      missed: false,
    };
  }
  if (decision.canStillPlayCurrentWeek) {
    return {
      message: "Make your pick before kickoff—don’t leave your mates hanging.",
      ctaLabel: "Pick now",
      href: pickHrefForWeek(decision.poolCurrentWeek),
      missed: false,
    };
  }
  return {
    message: "Missed pick — automatic loss at lock.",
    ctaLabel: null,
    href: null,
    missed: true,
  };
}

/** Build a decision from already-loaded weeks (layout / Pick / API). */
export function resolvePlayerPickWeekFromLoaded(input: {
  poolCurrentWeek: number;
  weeks: Array<{
    number: number;
    locked: boolean;
    games: Array<
      GameStartBits & { id: string; awayAbbr: string; homeAbbr: string }
    >;
  }>;
  currentPick: ExistingPickBits;
  playingFromWeek?: number | null;
  now?: Date;
}): PlayerPickWeek {
  const current = input.weeks.find((w) => w.number === input.poolCurrentWeek);
  const nextWeek = input.poolCurrentWeek + 1;
  const next = input.weeks.find((w) => w.number === nextWeek);
  return resolvePlayerPickWeek({
    poolCurrentWeek: input.poolCurrentWeek,
    currentWeekLocked: current?.locked ?? true,
    existingCurrentPick: input.currentPick,
    existingCurrentGame: gameForPick(input.currentPick, current?.games ?? []),
    playingFromWeek: input.playingFromWeek,
    nextWeekHasGames: (next?.games.length ?? 0) > 0,
    nextWeekLocked: next?.locked ?? false,
    now: input.now,
  });
}
