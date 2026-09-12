"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
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
    <main className="min-h-dvh mx-auto max-w-pool px-4 py-16">
      <p className="text-crimson-400 text-sm font-medium tracking-wide uppercase mb-3">
        Error
      </p>
      <h1 className="font-display text-3xl text-gold-400 tracking-wide mb-3">
        Something went wrong
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        The page failed to load. Try again, or head back to the pool.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/pool" className="btn-secondary inline-flex items-center justify-center">
          Back to pool
        </Link>
      </div>
    </main>
  );
}
