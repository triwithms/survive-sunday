import { effectiveLockAt } from "@/lib/grading";
import { formatKickoff } from "@/lib/utils";
import { pickHrefForWeek, type PlayerPickWeek } from "@/lib/next-week-picks";
import type { BoardCta } from "./types";

export function boardLockLine(
  week: { lockAt: Date; lockOverrideAt: Date | null } | null,
  locked: boolean,
  canChangePick: boolean
) {
  if (!week) return "Current week unavailable";
  const suffix = locked
    ? canChangePick
      ? " · You can still change until your pick’s kickoff"
      : " · Picks locked"
    : " · Picks still open";
  return `Lock: ${formatKickoff(effectiveLockAt(week))}${suffix}`;
}

export function boardSortLine(revealAllPicks: boolean) {
  return (
    "Sorted by undefeated, then one-loss, then eliminated. Within each group: same pick (no pick last), then same game (earlier kickoff first), then nickname A–Z." +
    (!revealAllPicks ? " Others' picks stay hidden until the deadline." : "")
  );
}

export function boardCta(args: {
  canChangePick: boolean;
  showMakePick: boolean;
  showMutedChange: boolean;
  weekNumber: number;
  decision: PlayerPickWeek;
  adminSpectator: boolean;
}): BoardCta | null {
  if (args.canChangePick) {
    return { href: pickHrefForWeek(args.weekNumber), label: "Change pick" };
  }
  if (args.decision.reason === "next_game_pending") {
    return { href: pickHrefForWeek(args.decision.nextWeek), label: "Change pick" };
  }
  if (args.showMakePick) {
    return {
      href: pickHrefForWeek(args.decision.nextWeek),
      label: `Week ${args.decision.nextWeek} is open — make your pick`,
    };
  }
  if (args.showMutedChange) {
    return {
      href: "/pick",
      muted: true,
      title: args.adminSpectator ? "Commissioner — optional" : "Picks unavailable",
      label: args.adminSpectator ? "Change pick (optional)" : "Pick",
    };
  }
  return null;
}
