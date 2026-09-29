export function HelpSignIn() {
  return (
    <section id="how-to-sign-in">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">How to sign in</h2>
      <ol className="list-decimal pl-5 space-y-1 text-[var(--text-muted)] mb-2">
        <li className="text-[var(--text-primary)]">
          Open the app. You land on <strong>Sign in</strong> — email (or
          username) and password only. There is no people list and no pool
          code.
        </li>
        <li className="text-[var(--text-primary)]">
          If an administrator texted you a login, use that email and password.
          Tap <strong>Sign in</strong>. Settings has no password box. To choose
          a new one, use <strong>Forgot password?</strong>
        </li>
        <li className="text-[var(--text-primary)]">
          If they sent one shared join link, open that link, choose your email,
          password, and display name, and you enter that pool. Later visits use
          Sign in.
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
