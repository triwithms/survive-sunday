import { A2hsIosHint } from "@/components/features/a2hs/A2hsIosHint";

export function HelpAccount({ showDemoCopy = false }: { showDemoCopy?: boolean }) {
  return (
    <>
      <section id="10-team-pages">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">10. Standings, Schedule &amp; team research</h2>
        <p className="text-[var(--text-muted)] mb-2">
          **Standings** (bottom bar) shows NFL win-loss (by division / overall). That is not the pool **Leaderboard**.
          {showDemoCopy
            ? " Demo mode may show a practice table."
            : " **W-L** is this season from ESPN."}{" "}
          The **2025 rank** column is last season’s composite power rank by team (1 = strongest, 32 = weakest) — research only, not this year’s W-L.
        </p>
        <p className="text-[var(--text-muted)] mb-2">**Schedule** opens on **your current pick week**, same as My pick, Selections, and Scores, and you can still flip to Week 1 or any future week from the dropdown. **Schedule** and **My pick** list games with kickoff (or LIVE / Final score) and an informational favourite when ESPN has a real line (for example <strong>BUF favoured by 4.5</strong>). A pick&apos;em (spread 0) shows as <strong>Even (pick&apos;em)</strong>. Selections, Scores, Schedule, and My pick do <strong>not</strong> show TV stations or injury count chips. Live clock and down-and-distance stay on <strong>Scores</strong>. Open a <strong>team page</strong> for the ESPN injury list (player names). If ESPN has no line, the favourite field stays blank.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Team pages</strong> start with the team&apos;s record, this week&apos;s game (kickoff and the favourite when ESPN has a line), head coach (name + ESPN / Wikipedia links), and style, then key NFL players, full roster, an ESPN injury list (Out / Doubtful / Questionable / IR / suspension names), and news headlines. Tap a <strong>player name</strong> for college, depth role, and any ESPN injury note. This is ESPN&apos;s public list, not the official NFL club report.</p>
        <p className="text-[var(--text-muted)] mb-2">From <strong>This week&apos;s games</strong>, logos and names open research; <strong>Pick</strong> stays on its own button.</p>
        <p className="text-[var(--text-muted)] mb-2">Favourites in the pick flow are informational only. If ESPN has no line, that field stays hidden — we do not guess.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="11-install-the-app-pwa">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">11. Install the app (PWA)</h2>
        <p className="text-[var(--text-muted)] mb-2">Survive Sunday works in a phone browser, on a computer, or as a Home Screen app. After you Join or Sign in once, you stay signed in on that device — open the icon and you’re in the pool. We do not ask for a code every time.</p>
        <p className="text-[var(--text-muted)] mb-2">After Sign in on a phone, we ask if you want to add <strong>NFL Pool</strong> to the Home Screen. <strong>Yes</strong> / <strong>No</strong> / <strong>Not now</strong>. Not now asks again next Sign in. No stops asking — Help → <strong>Install on Home Screen</strong> (top of Help) shows the same Yes steps. If you already open the Home Screen icon, we do not nag. If you delete the icon and open in Safari, we ask again.</p>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">iPhone / iPad — Safari</p>
        <div className="mb-2">
          <A2hsIosHint />
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]"><strong>Android (Chrome):</strong> stay in Chrome. If you see <strong>Install</strong>, tap it. Or the three-dot menu → <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
          <li className="text-[var(--text-primary)]"><strong>Computer:</strong> any modern browser works. Bookmark the pool if you like.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">You’ll get the dark “stadium” theme and an offline shell so the chrome still loads when the network blips. Live scores and pick submits need a connection. If the Home Screen icon opens logged-out, Sign in once inside that icon.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="12-privacy-accounts">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">12. Privacy &amp; accounts</h2>
        <p className="text-[var(--text-muted)] mb-2">Pools are <strong>private and invite-only</strong>. Join with a <strong>personal Join link</strong>, then Sign in with your <strong>email and password</strong>.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">Your **nickname** is what the pool sees — it must be **unique within the pool** (case doesn’t matter). Returning BM Boys already have one seeded; tap **Account** in the header, then **Change nickname**. New members create a nickname when they join.</li>
          <li className="text-[var(--text-primary)]">**Real name** is optional — handy when friends already know each other offline.</li>
          <li className="text-[var(--text-primary)]">**Cell number:** add your cell for SMS missing-pick reminders and for password-reset texts. You can add or edit it later from Account. Missing-pick texts follow your Notification preferences; password-reset codes do not.</li>
          <li className="text-[var(--text-primary)]">**Notification preferences:** <strong>Account → Notification preferences</strong>. Each option is SMS / Email / both / none (coming soon until send works).</li>
          <li className="text-[var(--text-primary)]">
            <strong>Sign in:</strong> email + password, then Sign in. We do <strong>not</strong> ask for a code every time you open the app.
            {showDemoCopy
              ? " Demo seats (@survivesunday.demo) always use password demo1234."
              : ""}
          </li>
          <li className="text-[var(--text-primary)]">
            <strong>Forgot password:</strong> only after you have Joined. On Sign in, tap <strong>Forgot password?</strong>. We email a code (and text it if you saved a cell). Check inbox and spam/junk — codes may be filtered.
            {showDemoCopy
              ? " Demo seats (@survivesunday.demo) always use password demo1234 — no reset needed."
              : " Don’t use Forgot password before Join — there is no account yet."}
          </li>
          <li className="text-[var(--text-primary)]">**Sign out:** tap <strong>Account</strong> in the header (top right), then <strong>Sign out</strong>. It is also on Admin and this Help page. One tap signs you out and takes you to Sign in.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">To leave a pool or request data deletion, use the account/privacy controls (or contact your administrator) and see the privacy policy stub linked from settings.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="13-troubleshooting">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">13. Troubleshooting</h2>
        <pre className="card-glass p-3 text-xs overflow-x-auto whitespace-pre-wrap mb-2">{`| Symptom | Likely fix |
|---------|------------|
| Pick button disabled | Team already used, team on bye, or week already locked. |
| Can’t see mates’ picks | Week hasn’t locked yet — hang tight until first kickoff. |
| Missed SMS or emails | Account → Notification preferences — confirm that type is on. Add or update your cell under Account. Forgot-password codes always send when you request one (needs Resend keys). |
| Personal Join link says already claimed | That friend already Joined. They should Sign in with the email they used — not Join again. |
| Forgot password before Join | Don’t. Join first with your email + password. Forgot password only works after that same email has Joined. |
| Reset code did not arrive | Sign in → Forgot password?. Use the Join email. Check inbox and spam/junk — codes may be filtered. The page shows the real Resend reason if keys are missing. Administrator: Admin shows reset email status. |
| Forgot password | Sign in → Forgot password?${showDemoCopy ? " Demo seats use demo1234." : ""} After the page says the code was sent, check inbox and spam/junk. If sending fails, read the red text. |
| Friend stuck (no code) | Administrator: Admin → Set a temporary password (claimed seats only). Text them that password. They Sign in with email + that password. If they have not Joined, send their personal Join link instead. |
| Home Screen prompt keeps asking | Tap No to stop, or Not now to wait until next Sign in. Opening from the icon should not nag. Help → Install on Home Screen if you said No. |
| Asked to sign in again | Use the same phone/browser you signed in on. Add to Home Screen (Help §11). Session lasts about 90 days. |
| Want to switch account | Header → Account → Sign out (also on Admin and Help). Then Sign in. |
| Scores look wrong | Pull to refresh; if a final grade seems off, report it to your admin. |
| Share picture failed | Press and hold the Leaderboard or Scores title (or triple-tap the week). Try a shorter option. Or take a regular screenshot. |
| Gloves animation missing | Wave 2 — the H2H boxing-gloves animation is coming soon. |
| My pick says locked | **Your** game has started (or you never had a pick path). Next week should already be available (**Week 2 is open — make your pick**). You do not wait for Monday Night Football. There is no slate-wide deadline countdown. |
| Can’t change my pick | You can change until your pick’s kickoff, but only onto a game that has not started. Once that game starts, the pick is locked — make next week’s pick instead. |`}</pre>
        <p className="text-[var(--text-muted)] mb-2">Still stuck? Ask your administrator or check the pool notice for schedule overrides.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
    </>
  );
}
