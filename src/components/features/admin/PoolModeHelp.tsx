export function PoolModeHelp({ isPracticeLogin }: { isPracticeLogin: boolean }) {
  return (
    <>
      {isPracticeLogin ? (
        <p className="text-sm text-[var(--text-muted)]">
          You can turn Real mode on now. Then save your real email in{" "}
          <strong className="text-[var(--text-primary)]">
            System → Your commissioner login
          </strong>{" "}
          so you can sign back in. Friends will not see practice emails or
          passwords.
        </p>
      ) : null}
      <ul className="text-xs text-[var(--text-muted)] list-disc pl-5 space-y-1">
        <li>
          <strong className="text-[var(--text-primary)]">Real:</strong> Week 1
          board and picks. Week 2 is a real upcoming week. Home shows Who are
          you? (live roster), Join, and Sign in.
        </li>
        <li>
          <strong className="text-[var(--text-primary)]">Demo:</strong> practice
          picker on home and sign-in. Same NFL weeks, including Week 2.
        </li>
      </ul>
    </>
  );
}
