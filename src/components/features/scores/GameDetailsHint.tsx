import { ChevronRight } from "lucide-react";

/** Compact disclosure under the status / scorebug — not inside the TV strip. */
export function GameDetailsHint() {
  return (
    <span
      className="mt-1 inline-flex min-h-11 items-center justify-end gap-0.5 text-xs font-semibold uppercase tracking-wide text-gold-400"
      aria-hidden
      data-testid="game-details-hint"
      data-share-chrome=""
    >
      Details
      <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
    </span>
  );
}
