"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * While games are in a live kickoff window, poll ESPN sync and refresh Scores.
 */
export function LiveScoresRefresh({
  weekNumber,
  poll,
  intervalMs = 45000,
}: {
  weekNumber: number;
  poll: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    if (!poll) return;

    const sync = async () => {
      if (busy.current) return;
      busy.current = true;
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
      }
    };

    // Immediate sync when entering a live window
    void sync();
    const id = setInterval(sync, intervalMs);
    return () => clearInterval(id);
  }, [poll, weekNumber, intervalMs, router]);

  if (!poll) return null;

  return (
    <p className="text-[10px] text-[var(--text-muted)] px-0.5">
      Live window — refreshing from ESPN about every {Math.round(intervalMs / 1000)}s.
    </p>
  );
}
