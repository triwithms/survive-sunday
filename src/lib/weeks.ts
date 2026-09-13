export type WeekNavOption = {
  number: number;
  label: string;
  hasGames: boolean;
};

export const WEEK_NAV_PATHS = {
  "/pick": { allowFuture: true },
  "/pool": { allowFuture: false },
  "/scores": { allowFuture: false },
  "/schedule": { allowFuture: true },
} as const;

export type WeekNavPath = keyof typeof WEEK_NAV_PATHS;

export function parseWeekParam(
  raw: string | string[] | undefined | null
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

export function resolveSelectedWeekNumber({
  requested,
  weekNumbers,
  currentWeek,
  allowFuture = false,
}: {
  requested: number | null;
  weekNumbers: number[];
  currentWeek: number;
  allowFuture?: boolean;
}): number {
  const exists = (n: number) => weekNumbers.includes(n);
  if (
    requested != null &&
    exists(requested) &&
    (allowFuture || requested <= currentWeek)
  ) {
    return requested;
  }
  if (exists(currentWeek)) return currentWeek;
  return weekNumbers[0] ?? currentWeek;
}

/** Weeks the arrows / dropdown can land on. Matches WeekSwitcher. */
export function selectableWeeks<T extends WeekNavOption>(
  weeks: T[],
  currentWeek: number,
  allowFuture: boolean
): T[] {
  return weeks.filter((week) =>
    allowFuture ? true : week.hasGames && week.number <= currentWeek
  );
}

export function adjacentWeeks({
  weeks,
  selectedWeek,
  currentWeek,
  allowFuture,
}: {
  weeks: WeekNavOption[];
  selectedWeek: number;
  currentWeek: number;
  allowFuture: boolean;
}): { previous: number | null; next: number | null } {
  const selectable = selectableWeeks(weeks, currentWeek, allowFuture);
  const selectedIndex = selectable.findIndex(
    (week) => week.number === selectedWeek
  );
  return {
    previous: selectedIndex > 0 ? selectable[selectedIndex - 1].number : null,
    next:
      selectedIndex >= 0 && selectedIndex < selectable.length - 1
        ? selectable[selectedIndex + 1].number
        : null,
  };
}

export function weekNavForPath(
  pathname: string
): { basePath: WeekNavPath; allowFuture: boolean } | null {
  for (const [path, opts] of Object.entries(WEEK_NAV_PATHS)) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return { basePath: path as WeekNavPath, allowFuture: opts.allowFuture };
    }
  }
  return null;
}
