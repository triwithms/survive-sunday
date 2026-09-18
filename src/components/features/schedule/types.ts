import type { WeekNavOption } from "@/lib/weeks";

export type ScheduleGame = {
  id: string;
  awayAbbr: string;
  homeAbbr: string;
  status: string;
  scoreLine: string;
  favouriteLabel: string | null;
  awayLogoUrl: string;
  homeLogoUrl: string;
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
};
