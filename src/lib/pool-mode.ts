export const POOL_MODE_DEMO = "demo";
export const POOL_MODE_LIVE = "live";
export type PoolMode = typeof POOL_MODE_DEMO | typeof POOL_MODE_LIVE;

export const DEMO_EMAIL_SUFFIX = "@survivesunday.demo";

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
