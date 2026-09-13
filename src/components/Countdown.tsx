"use client";

import { useEffect, useState } from "react";

/**
 * Header countdown to the week's pick deadline (first kickoff / effective lock).
 */
export function Countdown({ lockAt }: { lockAt: string }) {
  // Stable placeholder on the server so Date.now() cannot mismatch hydration.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const hint =
    "Pick deadline — locks at this week's first kickoff. After that you can't change picks and everyone else's picks reveal.";

  const target = new Date(lockAt).getTime();
  if (!Number.isFinite(target)) {
    return (
      <span className="font-mono text-[var(--text-muted)] text-xs sm:text-sm">
        —
      </span>
    );
  }

  if (now === null) {
    return (
      <span
        className="inline-flex flex-col items-center sm:items-start gap-0 min-w-0"
        title={hint}
      >
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gold-400/90 leading-none">
          Pick deadline
        </span>
        <span className="font-mono text-gold-400 text-xs sm:text-sm tabular-nums whitespace-nowrap">
          <span className="opacity-0">00h 00m</span>
        </span>
      </span>
    );
  }

  const diff = target - now;

  if (diff <= 0) {
    return (
      <span
        className="inline-flex flex-col items-center sm:items-start gap-0 min-w-0"
        title={hint}
      >
        <span className="font-display tracking-wide text-crimson-400 text-xs sm:text-sm uppercase shrink-0">
          Deadline passed
        </span>
        <span className="hidden sm:block text-[10px] text-[var(--text-muted)] leading-none mt-0.5">
          Picks locked · first kickoff
        </span>
      </span>
    );
  }

  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const compact = [
    d > 0 ? `${d}d` : null,
    `${h.toString().padStart(2, "0")}h`,
    `${m.toString().padStart(2, "0")}m`,
  ].filter(Boolean);

  const full = [...compact, `${sec.toString().padStart(2, "0")}s`];

  return (
    <span
      className="inline-flex flex-col items-center sm:items-start gap-0 min-w-0"
      title={hint}
      aria-label={`Pick deadline in ${full.join(" ")}. ${hint}`}
      aria-live="polite"
    >
      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gold-400/90 leading-none">
        Pick deadline
      </span>
      <span className="font-mono text-gold-400 text-xs sm:text-sm tabular-nums whitespace-nowrap">
        <span className="sm:hidden">{compact.join(" ")}</span>
        <span className="hidden sm:inline">{full.join(" ")}</span>
      </span>
    </span>
  );
}
