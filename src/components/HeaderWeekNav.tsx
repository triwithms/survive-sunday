"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adjacentWeeks, type WeekNavOption } from "@/lib/weeks";
import { headerWeekSelection } from "@/lib/header-week-selection";
import {
  HeaderWeekBadge,
  WeekBadge,
  isLeaderboardPath,
  weekAllowsShare,
} from "@/components/HeaderWeekBadge";

export type HeaderWeek = WeekNavOption & {
  lockAt: string;
};

export type NextOpenDeadline = {
  weekNumber: number;
  lockAt: string;
};

export { HeaderWeekBadge };

const chevronClass = [
  "inline-flex items-center justify-center min-h-11 min-w-11 -mx-0.5 rounded-full shrink-0",
  "text-gold-400 hover:bg-gold-400/10 active:bg-gold-400/15",
  "disabled:text-[var(--text-muted)] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed",
].join(" ");

export function HeaderWeekNav({
  weeks,
  currentWeek,
  pickActionWeek,
}: {
  weeks: HeaderWeek[];
  currentWeek: number;
  pickActionWeek?: number;
  nextOpen?: NextOpenDeadline | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { route, defaultWeek, selectedWeek } = headerWeekSelection({
    pathname,
    weekParam: searchParams.get("week"),
    weekNumbers: weeks.map((week) => week.number),
    currentWeek,
    pickActionWeek,
  });
  if (isLeaderboardPath(pathname)) {
    return <div className="min-w-0 flex-1" aria-hidden />;
  }
  if (!route || weeks.length <= 1) {
    return <HeaderWeekBadge weekNumber={currentWeek} />;
  }

  const { previous, next } = adjacentWeeks({
    weeks,
    selectedWeek,
    currentWeek: defaultWeek,
    allowFuture: route.allowFuture,
  });
  const previousWeek = previous
    ? weeks.find((week) => week.number === previous)
    : null;
  const nextWeek = next ? weeks.find((week) => week.number === next) : null;
  const goTo = (week: number) => {
    if (!route.allowFuture && week > defaultWeek) return;
    router.push(`${route.basePath}?week=${week}`);
  };

  return (
    <nav
      aria-label="Header week navigation"
      data-testid="header-week-nav"
      className="flex items-center justify-center shrink-0 min-w-0 flex-1"
    >
      <button
        type="button"
        onClick={() => previous && goTo(previous)}
        disabled={!previous}
        aria-label={previousWeek ? `Previous week, ${previousWeek.label}` : "No previous week"}
        className={chevronClass}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <WeekBadge
        weekNumber={currentWeek}
        allowShareGesture={weekAllowsShare(pathname)}
      />
      <button
        type="button"
        onClick={() => next && goTo(next)}
        disabled={!next}
        aria-label={nextWeek ? `Next week, ${nextWeek.label}` : "No next week"}
        className={chevronClass}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </nav>
  );
}
