import type { WeekNavOption } from "@/lib/weeks";

export type VideosScreenProps = {
  weekLabel: string;
  weekOptions: WeekNavOption[];
  selectedWeek: number;
  /** Current pick week this screen labels “This week”. */
  focusWeek: number;
};
