/** Client live-score poll. One sync per interval per browser, and only while the tab is visible. */

export const LIVE_SCORE_POLL_MS = 10 * 60 * 1000;
/** Scores Refresh pulls ESPN when the saved scoreboard is older than this. */
export const MANUAL_SCORE_REFRESH_MS = 30_000;

/** True when a Refresh press should start a live scoreboard fetch. */
export function manualScoreRefreshShouldFetch(
  fetchedAt: number | null,
  now: number,
  maxAgeMs = MANUAL_SCORE_REFRESH_MS
): boolean {
  return fetchedAt == null || now - fetchedAt >= maxAgeMs;
}

export function shouldRunLiveScoreSync(opts: {
  force?: boolean;
  visible: boolean;
  now: number;
  lastSyncAt: number;
  intervalMs: number;
}): boolean {
  if (opts.force) return true;
  if (!opts.visible) return false;
  return opts.now - opts.lastSyncAt >= opts.intervalMs;
}

/** True when the Sunday poll should re-render the open tab. */
export function scoreSyncShouldRefresh(
  body: { changed?: boolean; updated?: number; mirrored?: number } | null
): boolean {
  if (!body || typeof body !== "object") return false;
  if (body.changed === true) return true;
  if ((body.updated ?? 0) > 0) return true;
  if ((body.mirrored ?? 0) > 0) return true;
  return false;
}
