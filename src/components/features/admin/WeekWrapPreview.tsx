export function WeekWrapPreview(props: {
  subject: string;
  html: string;
  text: string;
  sms: string;
}) {
  return (
    <div className="space-y-2 text-sm" data-testid="week-wrap-preview">
      <p className="font-medium">Preview</p>
      <p className="text-[var(--text-muted)]">Email · {props.subject}</p>
      <iframe
        title="Week wrap email preview"
        sandbox=""
        srcDoc={props.html}
        className="w-full h-[560px] rounded-md border border-stadium-border bg-stadium-800"
        data-testid="week-wrap-email-html"
      />
      <p className="text-xs text-[var(--text-muted)]">
        Leaderboard is the pool right now. NFL records are from the last sync;
        Send refreshes them and drops that section if ESPN is down.
      </p>
      <details>
        <summary className="cursor-pointer text-[var(--text-muted)] min-h-11">
          Plain-text email
        </summary>
        <pre className="whitespace-pre-wrap rounded-md bg-stadium-800 p-3 text-xs">
          {props.text}
        </pre>
      </details>
      <p className="text-[var(--text-muted)]">SMS · short facts</p>
      <pre className="whitespace-pre-wrap rounded-md bg-stadium-800 p-3 text-xs">
        {props.sms}
      </pre>
    </div>
  );
}
