import { pickOutCopy } from "./pick-out-copy";

/**
 * Near-full cover of My pick when the signed-in player is eliminated.
 * Lives in the content pane so header Help/Account and bottom nav stay usable.
 */
export function PickOutOverlay() {
  const copy = pickOutCopy();
  return (
    <div
      data-testid="pick-out-overlay"
      role="alert"
      aria-live="assertive"
      className="relative z-20 flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center overflow-hidden rounded-2xl border-4 border-crimson-400 bg-stadium-950 px-5 py-12 text-center shadow-[0_0_80px_rgba(232,93,93,0.45)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,93,93,0.22),transparent_70%)]"
      />
      <p className="relative text-xs font-semibold uppercase tracking-[0.35em] text-crimson-400">
        {copy.kicker}
      </p>
      <h1 className="font-display relative mt-4 text-5xl leading-none text-crimson-400 sm:text-7xl">
        {copy.heading}
      </h1>
      <p className="relative mt-6 max-w-md text-base text-[var(--text-primary)] sm:text-lg">
        {copy.body}
      </p>
      <p className="relative mt-4 max-w-md text-sm text-[var(--text-muted)]">
        {copy.hint}
      </p>
    </div>
  );
}
