export const POOL_MODE_DEMO = "demo";
export const POOL_MODE_LIVE = "live";
export type PoolMode = typeof POOL_MODE_DEMO | typeof POOL_MODE_LIVE;

export const DEMO_EMAIL_SUFFIX = "@survivesunday.demo";

/** Real NFL week right now. Live mode always uses this. */
export const REAL_CURRENT_WEEK = 1;
/** Demo slate / commissioner sandbox only — not for participants in Real mode. */
export const DEMO_SANDBOX_WEEK = 2;

export function normalizePoolMode(mode: string | null | undefined): PoolMode {
  return mode === POOL_MODE_LIVE ? POOL_MODE_LIVE : POOL_MODE_DEMO;
}

export function isDemoMode(mode: string | null | undefined): boolean {
  return normalizePoolMode(mode) === POOL_MODE_DEMO;
}

export function isLiveMode(mode: string | null | undefined): boolean {
  return normalizePoolMode(mode) === POOL_MODE_LIVE;
}

export function isDemoEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase().endsWith(DEMO_EMAIL_SUFFIX);
}

export function effectiveCurrentWeek(
  mode: string | null | undefined,
  storedWeek: number | null | undefined
): number {
  if (isLiveMode(mode)) return REAL_CURRENT_WEEK;
  return typeof storedWeek === "number" && storedWeek > 0
    ? storedWeek
    : DEMO_SANDBOX_WEEK;
}

/** Week 2 demo slate is unreachable for participants while Real mode is on. */
export function isSandboxWeekHidden(
  mode: string | null | undefined,
  weekNumber: number
): boolean {
  return isLiveMode(mode) && weekNumber === DEMO_SANDBOX_WEEK;
}

export function weeksForParticipants<T extends { number: number }>(
  mode: string | null | undefined,
  weeks: T[]
): T[] {
  if (!isLiveMode(mode)) return weeks;
  return weeks.filter((week) => week.number !== DEMO_SANDBOX_WEEK);
}
