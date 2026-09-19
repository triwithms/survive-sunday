import type { WeekNavOption } from "@/lib/weeks";

export type HeaderWeek = WeekNavOption & {
  lockAt: string;
};

export type NextOpenDeadline = {
  weekNumber: number;
  lockAt: string;
};

export { HeaderWeekBadge } from "@/components/HeaderWeekBadge";
