"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card-glass p-5 space-y-4">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Pool page failed
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          This screen hit an error. Your session is still here — try again or
          open another tab.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/pool" className="btn-secondary inline-flex items-center justify-center">
          Pool home
        </Link>
      </div>
    </div>
  );
}
