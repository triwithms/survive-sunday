"use client";

import { useEffect, useState } from "react";

export function Countdown({ lockAt }: { lockAt: string }) {
  // Render a stable placeholder on the server so Date.now() cannot
  // mismatch between RSC HTML and hydration (Next.js red "1 Error" toast).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
      <span className="font-mono text-gold-400 text-xs sm:text-sm tabular-nums whitespace-nowrap">
        <span className="opacity-0">00h 00m</span>
      </span>
    );
  }

  const diff = target - now;

  if (diff <= 0) {
    return (
      <span className="font-display tracking-wide text-crimson-400 text-xs sm:text-sm uppercase shrink-0">
        Locked
      </span>
    );
  }

  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  // Narrow phones: drop seconds to reduce header width
  const compact = [
    d > 0 ? `${d}d` : null,
    `${h.toString().padStart(2, "0")}h`,
    `${m.toString().padStart(2, "0")}m`,
  ].filter(Boolean);

  const full = [...compact, `${sec.toString().padStart(2, "0")}s`];

  return (
    <span
      className="font-mono text-gold-400 text-xs sm:text-sm tabular-nums whitespace-nowrap"
      aria-live="polite"
    >
      <span className="sm:hidden">{compact.join(" ")}</span>
      <span className="hidden sm:inline">{full.join(" ")}</span>
    </span>
  );
}
