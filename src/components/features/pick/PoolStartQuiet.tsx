import { PickHeader } from "./PickHeader";

/** Quiet line before this pool’s first week. No pick controls. */
export function PoolStartQuiet({
  weekNumber,
  notice,
}: {
  weekNumber: number;
  notice: string;
}) {
  return (
    <div className="space-y-4">
      <PickHeader weekNumber={weekNumber} kicker="Picks are not open yet." />
      <p
        role="status"
        data-testid="pool-start-banner"
        className="text-sm text-[var(--text-muted)]"
      >
        {notice}
      </p>
    </div>
  );
}
