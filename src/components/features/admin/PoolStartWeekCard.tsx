import { Card } from "@/components/ui";

/** Read-only. The first week is chosen when the pool is created. */
export function PoolStartWeekCard({ startWeek }: { startWeek: number | null }) {
  if (startWeek == null) return null;
  return (
    <Card as="section" className="p-4 space-y-1" data-testid="pool-start-week-admin">
      <h2 className="font-semibold">First week</h2>
      <p className="text-sm text-[var(--text-primary)]">Week {startWeek}</p>
      <p className="text-sm text-[var(--text-muted)]">
        Weeks before Week {startWeek} do not count. No picks, losses, or
        reminders. Set when this pool was created.
      </p>
    </Card>
  );
}
