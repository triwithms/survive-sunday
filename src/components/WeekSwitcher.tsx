"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adjacentWeeks, selectableWeeks } from "@/lib/weeks";

export type WeekSwitcherOption = {
  number: number;
  label: string;
  hasGames: boolean;
};

/**
 * Week nav for Pool/Scores: dropdown + prev/next arrows only.
 * Future weeks stay on Schedule unless allowFuture is set.
 */
export function WeekSwitcher({
  weeks,
  selectedWeek,
  currentWeek,
  basePath,
  allowFuture = false,
}: {
  weeks: WeekSwitcherOption[];
  selectedWeek: number;
  currentWeek: number;
  basePath: string;
  allowFuture?: boolean;
}) {
  const router = useRouter();
  // Schedule (allowFuture): every week, including TBA. Pool/Scores: past+current with games.
  const selectable = selectableWeeks(weeks, currentWeek, allowFuture);
  const selected = weeks.find((week) => week.number === selectedWeek);
  const options =
    selected && !selectable.some((week) => week.number === selectedWeek)
      ? [...selectable, selected].sort((a, b) => a.number - b.number)
      : selectable;
  const { previous: previousNumber, next: nextNumber } = adjacentWeeks({
    weeks,
    selectedWeek,
    currentWeek,
    allowFuture,
  });
  const previous = previousNumber
    ? selectable.find((week) => week.number === previousNumber) ?? null
    : null;
  const next = nextNumber
    ? selectable.find((week) => week.number === nextNumber) ?? null
    : null;
  const value = selectable.some((w) => w.number === selectedWeek)
    ? selectedWeek
    : currentWeek;

  const goTo = (week: number) => {
    if (!allowFuture && week > currentWeek) return;
    router.push(`${basePath}?week=${week}`);
  };

  if (!weeks.length) return null;

  return (
    <nav aria-label="Week navigation" className="card-glass p-2.5 space-y-1.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => previous && goTo(previous.number)}
          disabled={!previous}
          aria-label={
            previous ? `Previous week, ${previous.label}` : "No previous week"
          }
          className="btn-secondary inline-flex items-center justify-center min-h-11 min-w-11 px-2 py-2 shrink-0"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <label className="flex-1 min-w-0">
          <span className="sr-only">Select week</span>
          <select
            value={value}
            onChange={(event) => goTo(Number(event.target.value))}
            className="text-sm py-2 min-h-11"
          >
            {options.map((week) => (
              <option
                key={week.number}
                value={week.number}
                disabled={!allowFuture && week.number > currentWeek}
              >
                {week.label}
                {week.number === currentWeek ? " · This week" : ""}
                {!week.hasGames ? " · TBA" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => next && goTo(next.number)}
          disabled={!next}
          aria-label={next ? `Next week, ${next.label}` : "No next week"}
          className="btn-secondary inline-flex items-center justify-center min-h-11 min-w-11 px-2 py-2 shrink-0"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
      {!allowFuture ? (
        <p className="text-[10px] text-[var(--text-muted)] px-0.5">
          Future weeks are on Schedule — picks stay on the current week.
        </p>
      ) : (
        <p className="text-[10px] text-[var(--text-muted)] px-0.5">
          Flip weeks with the arrows or jump from the dropdown.
        </p>
      )}
    </nav>
  );
}
