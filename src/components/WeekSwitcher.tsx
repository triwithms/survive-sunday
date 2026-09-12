"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type WeekSwitcherOption = {
  number: number;
  label: string;
  hasGames: boolean;
};

export function WeekSwitcher({
  weeks,
  selectedWeek,
  currentWeek,
  basePath,
}: {
  weeks: WeekSwitcherOption[];
  selectedWeek: number;
  currentWeek: number;
  basePath: string;
}) {
  const router = useRouter();
  const gameWeeks = weeks.filter((week) => week.hasGames);
  const selected = weeks.find((week) => week.number === selectedWeek);
  const options = selected && !gameWeeks.some((week) => week.number === selectedWeek)
    ? [...gameWeeks, selected].sort((a, b) => a.number - b.number)
    : gameWeeks;
  const selectedIndex = gameWeeks.findIndex((week) => week.number === selectedWeek);
  const previous = selectedIndex > 0 ? gameWeeks[selectedIndex - 1] : null;
  const next =
    selectedIndex >= 0 && selectedIndex < gameWeeks.length - 1
      ? gameWeeks[selectedIndex + 1]
      : null;
  const goTo = (week: number) => router.push(`${basePath}?week=${week}`);

  if (!weeks.length) return null;

  return (
    <nav aria-label="Week navigation" className="card-glass p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => previous && goTo(previous.number)}
          disabled={!previous}
          className="btn-secondary text-xs px-3 py-2 min-h-0"
        >
          Prev
        </button>
        <label className="flex-1 min-w-0">
          <span className="sr-only">Select week</span>
          <select
            value={selectedWeek}
            onChange={(event) => goTo(Number(event.target.value))}
            className="text-sm py-2 min-h-0"
          >
            {options.map((week) => (
              <option key={week.number} value={week.number}>
                {week.label}{week.number === currentWeek ? " · This week" : ""}
                {!week.hasGames ? " · TBA" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => next && goTo(next.number)}
          disabled={!next}
          className="btn-secondary text-xs px-3 py-2 min-h-0"
        >
          Next
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="list">
        {gameWeeks.map((week) => {
          const active = week.number === selectedWeek;
          return (
            <Link
              key={week.number}
              href={`${basePath}?week=${week.number}`}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`chip shrink-0 text-xs ${
                active ? "chip-gold" : "chip-one-loss"
              }`}
            >
              {week.label}
              {week.number === currentWeek && (
                <span className="text-[10px]">This week</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
