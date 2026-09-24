import { ChevronRight } from "lucide-react";

/** Gold Game details › — centred so it reads as the matchup, not a team. */
export function PickGameDetailsButton({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      aria-haspopup="dialog"
      aria-label={label}
      data-testid="pick-game-details"
      className="inline-flex min-h-11 min-h-[44px] w-full items-center justify-center gap-0.5 rounded-md px-2 text-xs font-semibold uppercase tracking-wide text-gold-400 hover:bg-gold-400/10 active:bg-gold-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60"
    >
      Game details
      <ChevronRight className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2.5} />
    </button>
  );
}
