const field =
  "w-full rounded-md bg-stadium-800 border border-stadium-border px-3 py-2 text-sm";

export function WeekWrapOverrides(props: {
  emailOverride: string;
  smsOverride: string;
  onEmail: (value: string) => void;
  onSms: (value: string) => void;
}) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-[var(--text-muted)] min-h-11">
        Paste override (optional)
      </summary>
      <label className="block space-y-1 mt-2">
        <span className="text-[var(--text-muted)]">Email body</span>
        <textarea
          className={field}
          rows={4}
          value={props.emailOverride}
          onChange={(e) => props.onEmail(e.target.value)}
          placeholder="Leave blank to use the template"
          data-testid="week-wrap-email-override"
        />
      </label>
      <label className="block space-y-1 mt-2">
        <span className="text-[var(--text-muted)]">SMS body</span>
        <textarea
          className={field}
          rows={3}
          value={props.smsOverride}
          onChange={(e) => props.onSms(e.target.value)}
          placeholder="Leave blank for short facts"
          data-testid="week-wrap-sms-override"
        />
      </label>
    </details>
  );
}
