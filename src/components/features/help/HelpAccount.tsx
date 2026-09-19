export function HelpAccount() {
  return (
    <section id="account">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">
        Account / password reset
      </h2>
      <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
        <li className="text-[var(--text-primary)]">
          <strong>Account</strong> is in the header (top right). Change
          nickname, add a cell, Sign out.{" "}
          <strong>Account → Notification preferences</strong> stays there —
          not on Help. Each alert is SMS / Email / both / none (coming soon
          until send works).
        </li>
        <li className="text-[var(--text-primary)]">
          Sign in is email (or username) and password. We do not ask for a code
          every time.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Forgot password?</strong> is under Sign in. We email a 6-digit
          code (and text it if you saved a cell). Check spam/junk.
        </li>
        <li className="text-[var(--text-primary)]">
          You stay signed in about 90 days on this phone. If the Home Screen
          icon opens logged-out, Sign in once inside that icon.
        </li>
        <li className="text-[var(--text-primary)]">
          Stuck? Ask an administrator to set a temporary password and text it
          to you.
        </li>
      </ul>
    </section>
  );
}
