import type { PlayerPickWeek } from "@/lib/next-week-picks";
import type { PickMatchup } from "./types";

export type PickClientProps = {
  weekNumber: number;
  decision: PlayerPickWeek;
  locked: boolean;
  canChange: boolean;
  eliminated: boolean;
  spectator?: boolean;
  currentPick: string | null;
  games: PickMatchup[];
};

export function pickEmptyMessage(
  readOnly: boolean,
  weekNumber: number,
  decision: PlayerPickWeek,
  bannerTitle?: string
) {
  if (!readOnly) {
    return "No pick yet — choose a side from this week's games below.";
  }
  if (decision.nextWeekOpen && weekNumber === decision.poolCurrentWeek) {
    return `No Week ${weekNumber} pick — ${bannerTitle ?? `Week ${decision.nextWeek} is open.`}`;
  }
  return "No pick recorded for this week.";
}

export function pickChangeHint(readOnly: boolean, week1: boolean) {
  if (readOnly) return null;
  void week1;
  return "You can change until your game starts.";
}
