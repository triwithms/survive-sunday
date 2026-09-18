export const POOL_MODE_DEMO = "demo";
export const POOL_MODE_LIVE = "live";
export type PoolMode = typeof POOL_MODE_DEMO | typeof POOL_MODE_LIVE;

export const DEMO_EMAIL_SUFFIX = "@survivesunday.demo";
/** Leftover unclaimed-seat placeholders (not a real login). */
export const PENDING_EMAIL_SUFFIX = "@pending.survivesunday.local";
export const LOCAL_PLACEHOLDER_HOST = "survivesunday.local";

/** Fallback only if the pool has no stored current week. */
export const REAL_CURRENT_WEEK = 1;
/** Leftover Week 2 sandbox constant. Week 2 is a real NFL week. */
export const DEMO_SANDBOX_WEEK = 2;

export function normalizePoolMode(mode: string | null | undefined): PoolMode {
  return mode === POOL_MODE_DEMO ? POOL_MODE_DEMO : POOL_MODE_LIVE;
}

export function isDemoMode(mode: string | null | undefined): boolean {
  return normalizePoolMode(mode) === POOL_MODE_DEMO;
}

export function isLiveMode(mode: string | null | undefined): boolean {
  return normalizePoolMode(mode) === POOL_MODE_LIVE;
}

export function normalizePracticeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1) : "";
}

/**
 * Leftover commissioner placeholders such as
 * `go-giants@pending.survivesunday.local` — not a real claimed login.
 */
export function isPendingPlaceholderEmail(
  email: string | null | undefined
): boolean {
  const domain = emailDomain(normalizePracticeEmail(email));
  if (!domain) return false;
  return (
    domain === LOCAL_PLACEHOLDER_HOST ||
    domain.endsWith(`.${LOCAL_PLACEHOLDER_HOST}`)
  );
}

/**
 * Practice / unclaimed-seat addresses: `@survivesunday.demo` and
 * leftover `@pending.survivesunday.local` (and similar `.local`) placeholders.
 */
export function isDemoEmail(email: string | null | undefined): boolean {
  const normalized = normalizePracticeEmail(email);
  return (
    normalized.endsWith(DEMO_EMAIL_SUFFIX) || isPendingPlaceholderEmail(normalized)
  );
}

/** Map a pending placeholder to the matching `@survivesunday.demo` practice email. */
export function practiceEmailFromPlaceholder(
  email: string | null | undefined
): string | null {
  const normalized = normalizePracticeEmail(email);
  if (!isPendingPlaceholderEmail(normalized)) return null;
  const local = normalized.slice(0, normalized.lastIndexOf("@"));
  if (!local) return null;
  return `${local}${DEMO_EMAIL_SUFFIX}`;
}

/** Live-only: use the stored pool week. Do not pin to Week 1. */
export function effectiveCurrentWeek(
  mode: string | null | undefined,
  storedWeek: number | null | undefined
): number {
  void mode;
  return storedWeek && storedWeek >= 1 ? storedWeek : REAL_CURRENT_WEEK;
}

/** Week 2 is a real NFL week — never hide that slate. */
export function isSandboxWeekHidden(
  mode: string | null | undefined,
  weekNumber: number
): boolean {
  void mode;
  void weekNumber;
  return false;
}

export function weeksForParticipants<T extends { number: number }>(
  mode: string | null | undefined,
  weeks: T[]
): T[] {
  void mode;
  return weeks;
}
