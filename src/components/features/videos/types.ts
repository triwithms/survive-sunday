import type { WeekNavOption } from "@/lib/weeks";

export type VideosScreenProps = {
  weekLabel: string;
  weekOptions: WeekNavOption[];
  selectedWeek: number;
  /** Same current pick week Home / Scores use for “This week”. */
  focusWeek: number;
};
