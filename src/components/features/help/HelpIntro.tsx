export function HelpIntro() {
  return (
    <>
      <aside className="card-glass border border-gold-400/30 p-4 space-y-2" aria-label="Feature availability">
        <p className="text-[var(--text-primary)]"><strong>Wave 1 is live:</strong> picks, mulligan, lock and pick privacy, Leaderboard (pool in/out), NFL Standings, scores and grading, Schedule, team research, YouTube clips on Scores → Details, prior-pick import, Admin tools, PWA install, <strong>personal Join links</strong>, joining, email-and-password Sign in that stays on your phone, forgot-password codes, cell-number collection, <strong>notification preferences</strong> (<strong>Account → Notification preferences</strong>), and a quiet way to share Leaderboard or Scores as a picture (including a full long screenshot).</p>
        <p className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> H2H boxing gloves, banter and mute, WhatsApp, weekly digests, and close-game alerts.</p>
      </aside>
      <section id="onboarding-first-run">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Onboarding first-run</h2>
        <p className="text-[var(--text-muted)] mb-2">Welcome to Survive Sunday — your private NFL survivor pool for the 2026/27 season.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Pick one team each week** to win. You can’t reuse a team you’ve already picked, and bye-week teams are off the board.</li>
          <li className="text-[var(--text-primary)]">**Lock is first kickoff** (often Thursday night). After lock, everyone’s picks go public. You can still change an existing pick until that team’s kickoff if the new game has not started. **Once your pick’s game has started, next week’s picks open for you right away** — you don’t wait for Monday Night Football. New friends who join after that week’s deadline go straight to the next week’s pick.</li>
          <li className="text-[var(--text-primary)]">**You get one mulligan** unless the administrator turns it off. Your first wrong pick (or a missed pick at lock) burns it and you’re still in with one loss. A second loss eliminates you. If the administrator switches to one-and-done, the app shows **From Week X: no mulligan / one-and-done.**</li>
          <li className="text-[var(--text-primary)]"><strong>Sign in</strong> with the email and password the administrator texted you (or Forgot password after that). If we ask for nickname, full name, or cell, fill what’s missing once. Stay signed in on this phone. Returning BM Boys: <strong>Account → Change nickname</strong>.</li>
          <li className="text-[var(--text-primary)]"><strong>Live scores, Selections, and Leaderboard</strong> show how the pool is progressing. Add a <strong>cell number</strong> for SMS missing-pick reminders. You can add or change it later from Account or the header. Choose what we send under <strong>Account → Notification preferences</strong>. Wave 2 social features are marked below as coming soon.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="getting-started-join-signin-home-screen">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Getting started — Sign in, Home Screen</h2>
        <p className="text-[var(--text-muted)] mb-3">
          Click-by-click for friends and the administrator. More detail is in
          Help §11 (install), §12 (accounts), §13 (troubleshooting), and §14
          (administrators).
        </p>

        <h3 className="font-semibold mt-3 mb-1">A. Friend: Sign in</h3>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Open the app. You land on <strong>Sign in</strong> — email and password only.</li>
          <li className="text-[var(--text-primary)]">Use the email and password the administrator texted you. Tap <strong>Sign in</strong>.</li>
          <li className="text-[var(--text-primary)]">If we ask for nickname, full name, or cell, fill only what’s missing, then Continue.</li>
          <li className="text-[var(--text-primary)]">Stay signed in. Next time open the <strong>NFL Pool</strong> Home Screen icon or Sign in.</li>
        </ol>

        <h3 className="font-semibold mt-3 mb-1">B. Administrator: text a password</h3>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Sign in. Tap <strong>Admin</strong> → set a temporary password for that friend.</li>
          <li className="text-[var(--text-primary)]">Text them that email + password. They Sign in — they do not pick from a people list.</li>
        </ol>

        <h3 id="install-home-screen" className="font-semibold mt-3 mb-1">
          C. Add to Home Screen (make it an app)
        </h3>
        <p className="text-[var(--text-muted)] mb-2">
          After Sign in on a phone, we ask: <strong>Do you want to add NFL Pool
          to your Home Screen?</strong> Tap <strong>Yes</strong> to install or
          see the Safari □↑ steps. Tap <strong>Not now</strong> to ask again next
          Sign in. Tap <strong>No</strong> to stop asking — then use{" "}
          <strong>Install on Home Screen</strong> at the top of Help. Opening
          from the icon does not nag. If you delete the icon and open in Safari,
          we ask again.
        </p>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">iPhone / iPad — Safari</p>
        <p className="text-[var(--text-muted)] mb-3">
          Stay in <strong>Safari</strong>. Tap the box-with-arrow button (□↑) at the bottom of Safari (top on iPad) → <strong>Add to Home Screen</strong> → <strong>Add</strong>. The icon is named <strong>NFL Pool</strong>.
        </p>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Android — Chrome</p>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Stay in <strong>Chrome</strong>.</li>
          <li className="text-[var(--text-primary)]">If you see <strong>Install</strong>, tap it. Or tap the three dots → <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
          <li className="text-[var(--text-primary)]">Open the new icon. You stay signed in.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-3">
          Stuck? See <a href="#11-install-the-app-pwa" className="text-gold-400">Help §11</a> and{" "}
          <a href="#13-troubleshooting" className="text-gold-400">troubleshooting</a> (prompt keeps asking, asked to sign in again).
        </p>

        <h3 className="font-semibold mt-3 mb-1">D. Sign in later (same email)</h3>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">On this phone you stay signed in. Open the Home Screen icon to land on <strong>My pick</strong>.</li>
          <li className="text-[var(--text-primary)]">Need Sign in? Same email and password, then <strong>Sign in</strong>.</li>
          <li className="text-[var(--text-primary)]"><strong>Forgot password?</strong> is under Sign in. Check inbox <strong>and spam/junk</strong>. If you saved a cell, we text the code too.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
    </>
  );
}
