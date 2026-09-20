import { Play } from "lucide-react";

const TOUR_URL = "https://youtu.be/VlcYAX34_L8";

/** Help hub callout. Opens the ~5 min YouTube tour in a new tab. */
export function HelpQuickTour() {
  return (
    <a
      href={TOUR_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="card-glass mb-4 flex items-center gap-3 border border-gold-400/30 p-4 no-underline min-h-11 hover:bg-gold-400/5 active:bg-gold-400/10"
      aria-label="Quick tour of the NFL Pool app (opens YouTube)"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-400"
        aria-hidden
      >
        <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-gold-400">Quick tour</span>
        <span className="block text-[var(--text-muted)]">
          ~5 min screen-record of the NFL Pool app. Opens YouTube.
        </span>
      </span>
    </a>
  );
}
