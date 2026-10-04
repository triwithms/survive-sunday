"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LIVE_SCORE_POLL_MS,
  manualScoreRefreshShouldFetch,
  scoreSyncShouldRefresh,
  shouldRunLiveScoreSync,
} from "@/lib/live-refresh-gate";

/**
 * While games are in a live kickoff window, poll ESPN sync and refresh Scores.
 * Shared across My pick / Selections / Scores / Schedule so tab hops do not
 * each POST. Hidden tabs do not sync. Refresh pulls live scores when the
 * saved scoreboard is older than about 30 seconds.
 */
let lastLiveSyncAt = 0;
let lastManualSyncAt = 0;

export function LiveScoresRefresh({
  weekNumber,
  poll,
  intervalMs = LIVE_SCORE_POLL_MS,
  showRefresh = false,
}: {
  weekNumber: number;
  poll: boolean;
  intervalMs?: number;
  showRefresh?: boolean;
}) {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);

  const sync = useCallback(
    async (force = false) => {
      const now = Date.now();
      const visible =
        typeof document === "undefined" ||
        document.visibilityState === "visible";
      if (force) {
        if (!manualScoreRefreshShouldFetch(lastManualSyncAt || null, now)) return;
      } else if (
        !shouldRunLiveScoreSync({
          visible,
          now,
          lastSyncAt: lastLiveSyncAt,
          intervalMs,
        })
      ) {
        return;
      }
      if (busy.current) return;
      busy.current = true;
      lastLiveSyncAt = now;
      if (force) lastManualSyncAt = now;
      setPending(true);
      try {
        const res = await fetch("/api/scores/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ week: weekNumber, manual: force }),
        });
        const data = res.ok
          ? ((await res.json().catch(() => null)) as {
              changed?: boolean;
              updated?: number;
              mirrored?: number;
            } | null)
          : null;
        // Automatic poll: skip a Neon re-read when nothing changed.
        // Refresh still repaints so the list catches up to the saved scores.
        if (force || scoreSyncShouldRefresh(data)) router.refresh();
      } catch {
        // keep last paint — next visible tick retries
      } finally {
        busy.current = false;
        setPending(false);
      }
    },
    [weekNumber, intervalMs, router]
  );

  const syncRef = useRef(sync);
  syncRef.current = sync;

  useEffect(() => {
    if (!poll) return;
    const tick = () => {
      void syncRef.current(false);
    };
    tick();
    const id = window.setInterval(tick, intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll, intervalMs]);

  if (!poll && !showRefresh) return null;

  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      {showRefresh ? (
        <button
          type="button"
          className="btn-secondary text-sm w-full sm:w-auto disabled:opacity-45 disabled:cursor-not-allowed"
          disabled={pending}
          aria-busy={pending}
          data-testid="scores-refresh"
          onClick={() => void sync(true)}
        >
          {pending ? "Refreshing…" : "Refresh"}
        </button>
      ) : null}
      {poll ? (
        <p className="text-[10px] text-[var(--text-muted)] px-0.5">
          Live window — refreshing from ESPN about every{" "}
          {Math.round(intervalMs / 60000)} min while this tab is open.
        </p>
      ) : null}
    </div>
  );
}
