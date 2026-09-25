/** Client live-score poll. One sync per interval per browser, and only while the tab is visible. */

export const LIVE_SCORE_POLL_MS = 10 * 60 * 1000;

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
