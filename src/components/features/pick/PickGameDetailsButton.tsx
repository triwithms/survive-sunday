import { ChevronRight } from "lucide-react";

/** Scores-style Details › — a real control so the pick row can stay on Pick. */
export function PickGameDetailsButton({
  label,
  align,
  onOpen,
}: {
  label: string;
  align: "away" | "home";
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
      className={`inline-flex min-h-11 w-full items-center gap-0.5 rounded-md px-1 text-[10px] font-semibold uppercase tracking-wide text-gold-400 hover:bg-gold-400/10 active:bg-gold-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 ${
        align === "home" ? "justify-end" : "justify-start"
      }`}
    >
      Details
      <ChevronRight className="h-3 w-3 shrink-0" aria-hidden strokeWidth={2.5} />
    </button>
  );
}
