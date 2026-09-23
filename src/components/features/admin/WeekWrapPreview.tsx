export function WeekWrapPreview(props: {
  subject: string;
  text: string;
  sms: string;
}) {
  return (
    <div className="space-y-2 text-sm" data-testid="week-wrap-preview">
      <p className="font-medium">Preview</p>
      <p className="text-[var(--text-muted)]">Email · {props.subject}</p>
      <pre className="whitespace-pre-wrap rounded-md bg-stadium-800 p-3 text-xs">
        {props.text}
      </pre>
      <p className="text-[var(--text-muted)]">SMS · short facts</p>
      <pre className="whitespace-pre-wrap rounded-md bg-stadium-800 p-3 text-xs">
        {props.sms}
      </pre>
    </div>
  );
}
