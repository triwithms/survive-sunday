export function HelpIntro() {
  return (
    <>
      <aside className="card-glass border border-gold-400/30 p-4 space-y-2" aria-label="Feature availability">
        <p className="text-[var(--text-primary)]"><strong>Wave 1 is live:</strong> picks, mulligan, lock and pick privacy, standings, scores and grading, League, Schedule, team research, <strong>weekly YouTube videos</strong> (header <strong>Videos</strong>), game highlights on Scores → Details, prior-pick import, Admin tools, PWA install, <strong>personal Join links</strong>, joining, email-and-password Sign in that stays on your phone, forgot-password codes, cell-number collection, <strong>notification preferences</strong> (<strong>Account → Notification preferences</strong>), and a quiet way to share Board or Scores as a picture (including a full long screenshot).</p>
        <p className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> H2H boxing gloves, banter and mute, WhatsApp, weekly digests, and close-game alerts.</p>
      </aside>
      <section id="onboarding-first-run">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Onboarding first-run</h2>
        <p className="text-[var(--text-muted)] mb-2">Welcome to Survive Sunday — your private NFL survivor pool for the 2026/27 season.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Pick one team each week** to win. You can’t reuse a team you’ve already picked, and bye-week teams are off the board.</li>
          <li className="text-[var(--text-primary)]">**Lock is first kickoff** (often Thursday night). After lock, everyone’s picks go public. You can still change an existing pick until that team’s kickoff if the new game has not started. **Once your pick’s game has started, next week’s picks open for you right away** — you don’t wait for Monday Night Football. New friends who join after that week’s deadline go straight to the next week’s pick.</li>
          <li className="text-[var(--text-primary)]">**You get one mulligan** unless the administrator turns it off. Your first wrong pick (or a missed pick at lock) burns it and you’re still in with one loss. A second loss eliminates you. If the administrator switches to one-and-done, the app shows **From Week X: no mulligan / one-and-done.**</li>
          <li className="text-[var(--text-primary)]"><strong>Personal Join link</strong> from the administrator. Join <strong>once</strong> with your own email and password so your Week 1 picks stay. On that phone you stay signed in. Next time, Sign in with that <strong>email and password</strong>. If that name is already claimed, tap <strong>Sign in</strong>. Don’t use Forgot password before you Join. Returning BM Boys: <strong>Account → Change nickname</strong>. New joiners not on the list can join as a new player.</li>
          <li className="text-[var(--text-primary)]"><strong>Live scores and standings</strong> show how the pool is progressing. Add a <strong>cell number</strong> for SMS missing-pick reminders. You can add or change it later from Account or the header. Choose what we send under <strong>Account → Notification preferences</strong>. Wave 2 social features are marked below as coming soon.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="getting-started-join-signin-home-screen">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Getting started — Join, Sign in, Home Screen</h2>
        <p className="text-[var(--text-muted)] mb-3">
          Click-by-click for friends and the administrator. More detail is in
          Help §11 (install), §12 (accounts), §13 (troubleshooting), and §14
          (administrators).
        </p>

        <h3 className="font-semibold mt-3 mb-1">A. Friend: open your personal Join link</h3>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Open the link the administrator sent <strong>only to you</strong>. It looks like <code>survive-sunday.vercel.app/join?who=cannoli-stuffer</code>.</li>
          <li className="text-[var(--text-primary)]">Join should already show <strong>your name</strong>. The invite code is filled in — leave it.</li>
          <li className="text-[var(--text-primary)]">Enter <strong>your own email and a password</strong> (at least 6 characters). Tap Join. Do this <strong>once</strong>.</li>
          <li className="text-[var(--text-primary)]">Stay signed in on this phone. Next time, open the Home Screen icon or Sign in — do not Join again.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-3">
          <strong>If the page says this seat is already claimed:</strong> that
          name already Joined. Tap <strong>Sign in</strong>. Do not fill the Join
          form.
        </p>

        <h3 className="font-semibold mt-3 mb-1">B. Administrator: copy a personal Join link</h3>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Sign in. Tap <strong>Admin</strong> (gold link, top right).</li>
          <li className="text-[var(--text-primary)]">Find <strong>Personal Join links</strong>.</li>
          <li className="text-[var(--text-primary)]">Next to that friend, tap <strong>Copy</strong>.</li>
          <li className="text-[var(--text-primary)]">Text or email that <strong>one person</strong> their link. Do not paste one link into the group chat.</li>
        </ol>

        <h3 className="font-semibold mt-3 mb-1">C. Add to Home Screen (make it an app)</h3>
        <p className="text-[var(--text-muted)] mb-2">
          After you Join or Sign in on a phone browser, we may ask about the Home
          Screen. Tap <strong>Yes</strong>, <strong>Show me how</strong>, or{" "}
          <strong>Not now</strong>. If you already open the Home Screen icon, we
          do not nag.
        </p>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">iPhone / iPad — Safari</p>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Stay in <strong>Safari</strong> (not Chrome, and not the browser inside Messages).</li>
          <li className="text-[var(--text-primary)]">Tap <strong>Share</strong> (square with an arrow pointing up).</li>
          <li className="text-[var(--text-primary)]">Scroll and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
          <li className="text-[var(--text-primary)]">Open the new Survive Sunday icon. You stay signed in.</li>
        </ol>
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
          <li className="text-[var(--text-primary)]">Join <strong>once</strong> first. Forgot password only works after that.</li>
          <li className="text-[var(--text-primary)]">On this phone you stay signed in. Open the Home Screen icon to land in the pool.</li>
          <li className="text-[var(--text-primary)]">If you need Sign in: enter the <strong>same email</strong> you Joined with, your password, then tap <strong>Sign in</strong>.</li>
          <li className="text-[var(--text-primary)]"><strong>Forgot password?</strong> is the small link under Sign in — only after you Joined. Check inbox <strong>and spam/junk</strong> for the code. If you saved a cell, we text it too.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
    </>
  );
}
