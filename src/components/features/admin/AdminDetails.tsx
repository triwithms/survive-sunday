type Props = {
  title: string;
  summary?: string;
  children: React.ReactNode;
  danger?: boolean;
  testId?: string;
};

export function AdminDetails({ title, summary, children, danger, testId }: Props) {
  const border = danger
    ? "border-crimson-400/40"
    : "border-stadium-border";
  const titleClass = danger ? "text-crimson-400" : "text-[var(--text-primary)]";
  return (
    <details
      className={`card-glass p-3 min-w-0 ${border}`}
      data-testid={testId}
    >
      <summary
        className={`min-h-11 cursor-pointer font-semibold text-sm py-1 ${titleClass}`}
      >
        {title}
        {summary ? (
          <span className="mt-0.5 block text-xs font-normal text-[var(--text-muted)]">
            {summary}
          </span>
        ) : null}
      </summary>
      <div className="pt-3 space-y-3 min-w-0">{children}</div>
    </details>
  );
}
