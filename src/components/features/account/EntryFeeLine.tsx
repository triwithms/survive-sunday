"use client";

import { useState } from "react";
import {
  playerEntryFeeLine,
  type PlayerEntryFee,
} from "@/lib/payment-tracking";

export function EntryFeeLine({ fee }: { fee: PlayerEntryFee | null }) {
  const line = playerEntryFeeLine(fee);
  const [open, setOpen] = useState(false);
  if (!line || !fee?.enabled) return null;
  const showHow = fee.status === "unpaid";
  return (
    <div className="text-sm text-[var(--text-muted)]" data-testid="entry-fee-player">
      {showHow ? (
        <button
          type="button"
          className="min-h-11 text-left text-sm text-[var(--text-muted)]"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          data-testid="entry-fee-how-to-pay"
        >
          {line}
        </button>
      ) : (
        <p>{line}</p>
      )}
      {showHow && open ? (
        <div className="mt-2 space-y-2 text-sm text-[var(--text-primary)]">
          {fee.instructions ? (
            <p className="whitespace-pre-wrap">{fee.instructions}</p>
          ) : (
            <p>Your administrator has not added how to pay yet.</p>
          )}
          {fee.link ? (
            <a
              href={fee.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-gold-400"
            >
              Open payment link
            </a>
          ) : null}
          <p className="text-[var(--text-muted)]">This app never handles money.</p>
        </div>
      ) : null}
    </div>
  );
}
