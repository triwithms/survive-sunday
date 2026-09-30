"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { reportClientError } from "@/lib/client-error-report";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    // A digest means the server threw; onRequestError already stored it.
    if (!error?.digest) reportClientError("tab", error);
  }, [error]);

  return (
    <div role="alert" className="card-glass border border-crimson-400/40 p-5 space-y-4">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          This screen hit an error. Your pick and session are safe — retry, or
          use the tabs below.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            startTransition(() => {
              router.refresh();
              reset();
            })
          }
        >
          Retry
        </button>
        <Link href="/pick" className="btn-secondary inline-flex items-center justify-center">
          My pick
        </Link>
      </div>
    </div>
  );
}
