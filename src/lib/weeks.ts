export type WeekNavOption = {
  number: number;
  label: string;
  hasGames: boolean;
};

export const WEEK_NAV_PATHS = {
  "/pick": { allowFuture: true },
  "/pool": { allowFuture: false },
  /** Past weeks only. Future weeks stay on Schedule. */
  "/scores": { allowFuture: false },
  "/schedule": { allowFuture: true },
  "/videos": { allowFuture: true },
} as const;

export type WeekNavPath = keyof typeof WEEK_NAV_PATHS;

/** Pick and Scores open on that friend’s current pick week. */
export function usesPlayerPickWeekDefault(basePath: string): boolean {
  return basePath === "/pick" || basePath === "/scores";
}

/**
 * Default week when the URL has no `?week=`.
 * Pick / Scores: the signed-in user’s current pick week.
 * Schedule / Home / Videos: the pool’s current board week.
 */
export function defaultWeekForPath({
  basePath,
  poolCurrentWeek,
  pickActionWeek,
}: {
  basePath: string;
  poolCurrentWeek: number;
  pickActionWeek?: number;
}): number {
  if (usesPlayerPickWeekDefault(basePath) && pickActionWeek != null) {
    return pickActionWeek;
  }
  return poolCurrentWeek;
}

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

export function resolvePageWeekNumber({
  requested,
  weekNumbers,
  basePath,
  poolCurrentWeek,
  pickActionWeek,
  allowFuture = false,
}: {
  requested: number | null;
  weekNumbers: number[];
  basePath: string;
  poolCurrentWeek: number;
  pickActionWeek?: number;
  allowFuture?: boolean;
}): number {
  return resolveSelectedWeekNumber({
    requested,
    weekNumbers,
    currentWeek: defaultWeekForPath({
      basePath,
      poolCurrentWeek,
      pickActionWeek,
    }),
    allowFuture,
  });
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
