"use client";

import { useEffect } from "react";

/** Client navigate to /pool after cookies settle (fixes Safari "can't open page"). */
export function SignedInHandoff() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.location.replace("/pool");
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 stadium-bg">
      <p className="text-gold-400 font-display text-2xl tracking-wide mb-2">
        SURVIVE SUNDAY
      </p>
      <p className="text-[var(--text-muted)] text-sm">Taking you to the pool…</p>
      <a href="/pool" className="mt-6 text-sm text-gold-400 underline">
        Continue
      </a>
    </main>
  );
}
