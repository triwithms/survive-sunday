"use client";

import { useEffect } from "react";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";

/** Client navigate after cookies settle (fixes Safari "can't open page"). */
export function SignedInHandoff() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.location.replace(DEFAULT_SIGNED_IN_PATH);
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 stadium-bg">
      <p className="text-gold-400 font-display text-2xl tracking-wide mb-2">
        SURVIVE SUNDAY
      </p>
      <p className="text-[var(--text-muted)] text-sm">Taking you to My pick…</p>
      <a href={DEFAULT_SIGNED_IN_PATH} className="mt-6 text-sm text-gold-400 underline">
        Continue
      </a>
    </main>
  );
}
