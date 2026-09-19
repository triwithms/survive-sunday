"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * While games are in a live kickoff window, poll ESPN sync and refresh Scores.
 * Optional Refresh button works anytime and does not start polling.
 */
export function LiveScoresRefresh({
  weekNumber,
  poll,
  intervalMs = 600_000, // ~10 min
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

  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await fetch("/api/scores/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week: weekNumber }),
      });
      router.refresh();
    } catch {
      // keep last paint — next tick retries
    } finally {
      busy.current = false;
      setPending(false);
    }
  }, [weekNumber, router]);

  useEffect(() => {
    if (!poll) return;
    void sync();
    const id = setInterval(sync, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs, sync]);

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
          onClick={() => void sync()}
        >
          {pending ? "Refreshing…" : "Refresh"}
        </button>
      ) : null}
      {poll ? (
        <p className="text-[10px] text-[var(--text-muted)] px-0.5">
          Live window — refreshing from ESPN about every{" "}
          {Math.round(intervalMs / 60000)} min.
        </p>
      ) : null}
    </div>
  );
}
