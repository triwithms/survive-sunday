const COMING_SOON = "Coming soon — notifications not sending yet";

export function RosterNotifySoon() {
  return (
    <fieldset
      disabled
      className="space-y-2 rounded-lg border border-stadium-border p-3 opacity-60"
      data-testid="roster-notify-soon"
    >
      <legend className="px-1 text-sm font-medium">Notifications</legend>
      <p className="text-xs text-[var(--text-muted)]">{COMING_SOON}</p>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" disabled checked={false} readOnly />
        Email
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" disabled checked={false} readOnly />
        SMS
      </label>
    </fieldset>
  );
}
