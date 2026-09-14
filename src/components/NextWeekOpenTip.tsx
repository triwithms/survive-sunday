"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ss-next-week-open-tip";

/**
 * One-time calm note: next week opens when *your* game starts,
 * not after Monday Night Football.
 */
export function NextWeekOpenTip({ weekNumber }: { weekNumber: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="card-glass border border-gold-400/30 p-3 text-sm flex items-start justify-between gap-3"
    >
      <p className="text-[var(--text-muted)] min-w-0">
        Once your pick’s game starts, Week {weekNumber} opens for you — you
        don’t wait for Monday Night Football.
      </p>
      <button
        type="button"
        className="shrink-0 text-xs font-medium text-gold-400 hover:underline underline-offset-2"
        onClick={() => {
          try {
            window.localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setShow(false);
        }}
      >
        Got it
      </button>
    </div>
  );
}
