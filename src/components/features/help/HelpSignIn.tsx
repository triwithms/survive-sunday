export function HelpSignIn() {
  return (
    <section id="how-to-sign-in">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">How to sign in</h2>
      <ol className="list-decimal pl-5 space-y-1 text-[var(--text-muted)] mb-2">
        <li className="text-[var(--text-primary)]">
          Open the app. You land on <strong>Sign in</strong> — email (or
          username) and password only. There is no people list.
        </li>
        <li className="text-[var(--text-primary)]">
          Use the email and password the administrator texted you. Tap{" "}
          <strong>Sign in</strong>.
        </li>
        <li className="text-[var(--text-primary)]">
          If we ask for nickname, full name, or cell, fill only what’s missing,
          then continue. You land on <strong>My pick</strong>.
        </li>
        <li className="text-[var(--text-primary)]">
          You stay signed in on this phone. Next time, open the{" "}
          <strong>NFL Pool</strong> icon.
        </li>
      </ol>
      <p className="text-[var(--text-muted)]">
        <strong>Forgot password?</strong> is under Sign in. Check inbox and
        spam/junk. If you saved a cell, we text the code too. Help is the{" "}
        <strong>?</strong> in the header.
      </p>
    </section>
  );
}
