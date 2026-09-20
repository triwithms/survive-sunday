import { ChevronRight } from "lucide-react";

/** Scores-style gold Details › — a real control so team links stay on research. */
export function ScheduleDetailsButton({
  label,
  onOpen,
}: {
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={label}
      data-testid="schedule-game-details"
      className="inline-flex min-h-11 shrink-0 items-center justify-end gap-0.5 rounded-md px-1 text-[10px] font-semibold uppercase tracking-wide text-gold-400 hover:bg-gold-400/10 active:bg-gold-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60"
    >
      Details
      <ChevronRight className="h-3 w-3 shrink-0" aria-hidden strokeWidth={2.5} />
    </button>
  );
}
