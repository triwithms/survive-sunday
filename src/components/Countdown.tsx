"use client";

import { useEffect, useState } from "react";

export function Countdown({ lockAt }: { lockAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(lockAt).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <span className="font-display tracking-wide text-crimson-400 text-sm uppercase">
        Locked
      </span>
    );
  }

  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const parts = [
    d > 0 ? `${d}d` : null,
    `${h.toString().padStart(2, "0")}h`,
    `${m.toString().padStart(2, "0")}m`,
    `${sec.toString().padStart(2, "0")}s`,
  ].filter(Boolean);

  return (
    <span className="font-mono text-gold-400 text-sm tabular-nums" aria-live="polite">
      {parts.join(" ")}
    </span>
  );
}
