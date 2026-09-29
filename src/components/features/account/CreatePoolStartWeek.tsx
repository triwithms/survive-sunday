export function CreatePoolStartWeek({
  startWeeks,
  defaultStartWeek,
  startWeek,
  busy,
  onChange,
}: {
  startWeeks: number[];
  defaultStartWeek: number | null;
  startWeek: string;
  busy: boolean;
  onChange: (week: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--text-muted)]">First week</span>
      <select
        className="mt-1 w-full"
        value={startWeek}
        disabled={busy || startWeeks.length === 0}
        onChange={(event) => onChange(event.target.value)}
        data-testid="create-pool-start-week"
        required
      >
        {startWeeks.length === 0 ? (
          <option value="">No week left this season</option>
        ) : (
          startWeeks.map((week) => (
            <option key={week} value={week}>
              Week {week}
              {week === defaultStartWeek ? " (earliest)" : ""}
            </option>
          ))
        )}
      </select>
      <span className="mt-1 block text-xs text-[var(--text-muted)]">
        Weeks before this do not count. You can pick any later regular-season
        week.
      </span>
    </label>
  );
}
