"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Countdown } from "@/components/Countdown";
import {
  adjacentWeeks,
  defaultWeekForPath,
  parseWeekParam,
  resolvePageWeekNumber,
  weekNavForPath,
  type WeekNavOption,
} from "@/lib/weeks";
import {
  isTripleTap,
  recordTapTimes,
  SHARE_OPEN_EVENT,
} from "@/lib/share-export";

export type HeaderWeek = WeekNavOption & {
  lockAt: string;
};

export type NextOpenDeadline = {
  weekNumber: number;
  lockAt: string;
};

function shareablePath(path: string): boolean {
  return (
    path === "/standings" ||
    path.startsWith("/standings/") ||
    path === "/scores" ||
    path.startsWith("/scores/")
  );
}

function WeekBadge({
  weekNumber,
  allowShareGesture,
}: {
  weekNumber: number;
  allowShareGesture?: boolean;
}) {
  const taps = useRef<number[]>([]);

  function onWeekClick() {
    if (!allowShareGesture) return;
    taps.current = recordTapTimes(taps.current, Date.now());
    if (isTripleTap(taps.current)) {
      taps.current = [];
      window.dispatchEvent(new Event(SHARE_OPEN_EVENT));
    }
  }

  return (
    <span
      className="chip chip-gold shrink-0 min-w-9 justify-center select-none"
      aria-current="true"
      data-testid="header-week-badge"
      onClick={allowShareGesture ? onWeekClick : undefined}
    >
      W{weekNumber}
    </span>
  );
}

export function HeaderWeekBadge({
  weekNumber,
  lockAt,
  nextOpen,
}: {
  weekNumber: number;
  lockAt: string | null;
  nextOpen?: NextOpenDeadline | null;
}) {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-sm min-w-0 flex-1 justify-center overflow-hidden">
      <WeekBadge
        weekNumber={weekNumber}
        allowShareGesture={shareablePath(pathname)}
      />
      {lockAt && (
        <span className="min-w-0 overflow-hidden">
          <Countdown lockAt={lockAt} nextOpen={nextOpen} />
        </span>
      )}
    </div>
  );
}

const chevronClass = [
  "inline-flex items-center justify-center min-h-11 min-w-11 -mx-0.5 rounded-full shrink-0",
  "text-gold-400 hover:bg-gold-400/10 active:bg-gold-400/15",
  "disabled:text-[var(--text-muted)] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed",
].join(" ");

export function HeaderWeekNav({
  weeks,
  currentWeek,
  pickActionWeek,
  nextOpen,
}: {
  weeks: HeaderWeek[];
  currentWeek: number;
  /** Default week on /pool, /pick, /scores, and /videos when the URL has no ?week=. */
  pickActionWeek?: number;
  nextOpen?: NextOpenDeadline | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const route = weekNavForPath(pathname);

  const weekNumbers = weeks.map((week) => week.number);
  const requested = route ? parseWeekParam(searchParams.get("week")) : null;
  const defaultWeek = defaultWeekForPath({
    basePath: route?.basePath ?? "",
    poolCurrentWeek: currentWeek,
    pickActionWeek,
  });
  const selectedWeek = resolvePageWeekNumber({
    requested,
    weekNumbers,
    basePath: route?.basePath ?? "",
    poolCurrentWeek: currentWeek,
    pickActionWeek,
    allowFuture: route?.allowFuture ?? false,
  });
  const selected =
    weeks.find((week) => week.number === selectedWeek) ??
    weeks.find((week) => week.number === defaultWeek) ??
    weeks[0];
  const lockAt = selected?.lockAt ?? null;

  if (!route || weeks.length <= 1) {
    return (
      <HeaderWeekBadge
        weekNumber={selectedWeek}
        lockAt={lockAt}
        nextOpen={nextOpen}
      />
    );
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
    <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-1 text-sm min-w-0 flex-1 overflow-hidden">
      <nav
        aria-label="Header week navigation"
        data-testid="header-week-nav"
        className="flex items-center shrink-0"
      >
        <button
          type="button"
          onClick={() => previous && goTo(previous)}
          disabled={!previous}
          aria-label={
            previousWeek
              ? `Previous week, ${previousWeek.label}`
              : "No previous week"
          }
          className={chevronClass}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <WeekBadge
          weekNumber={selectedWeek}
          allowShareGesture={shareablePath(pathname)}
        />
        <button
          type="button"
          onClick={() => next && goTo(next)}
          disabled={!next}
          aria-label={
            nextWeek ? `Next week, ${nextWeek.label}` : "No next week"
          }
          className={chevronClass}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </nav>
      {lockAt && (
        <span className="min-w-0 overflow-hidden">
          <Countdown lockAt={lockAt} nextOpen={nextOpen} />
        </span>
      )}
    </div>
  );
}
