import { isEligibleNoonDayAfter, type WrapKickoff } from "./week-wrap-when";

export function shouldAutoSend(opts: {
  games: WrapKickoff[];
  now: Date;
  skippedWeeks: number[];
  weekNumber: number;
}): boolean {
  if (opts.skippedWeeks.includes(opts.weekNumber)) return false;
  return isEligibleNoonDayAfter(opts.games, opts.now);
}

export function preferredWrapWeek(
  weeks: Array<{ number: number; eligible: boolean; allFinal: boolean }>,
  fallback: number
): number {
  return (
    weeks.find((week) => week.eligible)?.number ??
    weeks.find((week) => week.allFinal)?.number ??
    weeks[0]?.number ??
    fallback
  );
}

export function wrapAutoStatus(week: {
  sent: boolean;
  skipped: boolean;
  eligible: boolean;
  allFinal: boolean;
}): string {
  if (week.sent) return "Already handled for this week. It will not send twice.";
  if (week.skipped) return "Skipped. Automatic send will not go out.";
  if (week.eligible) return "Due at the noon check (America/Toronto).";
  if (!week.allFinal) return "Waiting until every game this week is final.";
  return "Final. Auto send is noon Toronto the next day, not at the whistle.";
}
