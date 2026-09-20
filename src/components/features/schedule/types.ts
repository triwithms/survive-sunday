import type { WeekNavOption } from "@/lib/weeks";
import type { ScoreGameCardGame } from "@/components/features/scores/types";

export type ScheduleGame = ScoreGameCardGame & {
  scoreLine: string;
  favouriteLabel: string | null;
};

export type ScheduleScreenProps = {
  weekLabel: string;
  weekOptions: WeekNavOption[];
  selectedWeek: number;
  /** Same current pick week Home / Scores use for “This week”. */
  focusWeek: number;
  poll: boolean;
  lockLabel: string;
  locked: boolean;
  games: ScheduleGame[];
  openGameId: string | null;
};
