export function HelpContent({ showDemoCopy = false }: { showDemoCopy?: boolean }) {
  return (
    <article className="prose-survive space-y-6 text-sm leading-relaxed max-w-[68ch]">
      <aside className="card-glass border border-gold-400/30 p-4 space-y-2" aria-label="Feature availability">
        <p className="text-[var(--text-primary)]"><strong>Wave 1 is live:</strong> picks, mulligan, lock and pick privacy, standings, scores and grading, League, Schedule, team research, <strong>weekly YouTube videos</strong> (header <strong>Videos</strong>), game highlights on Scores → Details, prior-pick import, commissioner admin, PWA install, <strong>personal Join links</strong>, joining, sign-in that stays on your phone, sign-in codes, forgot-password codes, cell-number collection, <strong>notification preferences</strong> (<strong>Account → Notification preferences</strong>), and a quiet way to share Board or Scores as a picture (including a full long screenshot).</p>
        <p className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> H2H boxing gloves, banter and mute, WhatsApp, weekly digests, and close-game alerts.</p>
      </aside>
      <section id="onboarding-first-run">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Onboarding first-run</h2>
        <p className="text-[var(--text-muted)] mb-2">Welcome to Survive Sunday — your private NFL survivor pool for the 2026/27 season.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Pick one team each week** to win. You can’t reuse a team you’ve already picked, and bye-week teams are off the board.</li>
          <li className="text-[var(--text-primary)]">**Lock is first kickoff** (often Thursday night). After lock, everyone’s picks go public. **Week 1 only:** you can still change an existing pick until that team’s kickoff if the new game has not started. **Once your pick’s game has started, next week’s picks open for you right away** — you don’t wait for Monday Night Football. New friends who join after that week’s deadline go straight to the next week’s pick.</li>
          <li className="text-[var(--text-primary)]">**You get one mulligan** unless the commissioner turns it off. Your first wrong pick (or a missed pick at lock) burns it and you’re still in with one loss. A second loss eliminates you. If the commissioner switches to one-and-done, the app shows **From Week X: no mulligan / one-and-done.**</li>
          <li className="text-[var(--text-primary)]"><strong>Personal Join link</strong> from the commissioner. Join <strong>once</strong> with your own email and password so your Week 1 picks stay. On that phone you stay signed in. Next time, Sign in with a <strong>sign-in code</strong> (or your password). If that name is already claimed, tap <strong>Sign in</strong>. Don’t use Forgot password before you Join. Returning BM Boys: <strong>Account → Change nickname</strong>. New joiners not on the list can join as a new player.</li>
          <li className="text-[var(--text-primary)]"><strong>Live scores and standings</strong> show how the pool is progressing. Add a <strong>cell number</strong> for SMS missing-pick reminders. You can add or change it later from Account or the header. Choose what we send under <strong>Account → Notification preferences</strong>. Wave 2 social features are marked below as coming soon.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="getting-started-join-signin-home-screen">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Getting started — Join, Sign in, Home Screen</h2>
        <p className="text-[var(--text-muted)] mb-3">
          Click-by-click for friends and the commissioner. More detail is in
          Help §11 (install), §12 (accounts), §13 (troubleshooting), and §14
          (commissioner).
        </p>

        <h3 className="font-semibold mt-3 mb-1">A. Friend: open your personal Join link</h3>
        <ol className="list-decimal pl-5 space-y-1 mb-3 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Open the link the commissioner sent <strong>only to you</strong>. It looks like <code>survive-sunday.vercel.app/join?who=cannoli-stuffer</code>.</li>
          <li className="text-[var(--text-primary)]">Join should already show <strong>your name</strong>. The invite code is filled in — leave it.</li>
          <li className="text-[var(--text-primary)]">Enter <strong>your own email and a password</strong> (at least 6 characters). Tap Join. Do this <strong>once</strong>.</li>
          <li className="text-[var(--text-primary)]">Stay signed in on this phone. Next time, open the Home Screen icon or Sign in — do not Join again.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-3">
          <strong>If the page says this seat is already claimed:</strong> that
          name already Joined. Tap <strong>Sign in</strong>. Do not fill the Join
          form.
        </p>

        <h3 className="font-semibold mt-3 mb-1">B. Commissioner: copy a personal Join link</h3>
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
          <li className="text-[var(--text-primary)]">Join <strong>once</strong> first. Codes only work after that.</li>
          <li className="text-[var(--text-primary)]">On this phone you stay signed in. Open the Home Screen icon to land in the pool.</li>
          <li className="text-[var(--text-primary)]">If you need Sign in: enter the <strong>same email</strong> you Joined with, then tap <strong>Email me a sign-in code</strong>. If sending fails, the page says why (it will not pretend a code went out).</li>
          <li className="text-[var(--text-primary)]">Know your password? Tap <strong>Use password instead</strong>.</li>
          <li className="text-[var(--text-primary)]"><strong>Forgot password</strong> is a small link on the password screen — only after you Joined.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="1-welcome-to-survive-sunday">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">1. Welcome to Survive Sunday</h2>
        <p className="text-[var(--text-muted)] mb-2">Survive Sunday is a private, invite-only NFL survivor (elimination) pool for friends. Each week, every active player picks one team to win. Pick right and you keep going. Pick wrong and you burn your mulligan — or you’re out.</p>
        <p className="text-[var(--text-muted)] mb-2">This pool covers the **2026/27 NFL regular season** (weeks 1–18). Playoffs may come later; for now we’re all about surviving the grind.</p>
        <p className="text-[var(--text-muted)] mb-2">**For entertainment among friends. Not a gambling service.** Spreads and moneylines you see in the app are informational only — you can’t place wagers here.</p>
        <p className="text-[var(--text-muted)] mb-2">The app is written in **Canadian English** (`en-CA`): favourite, cancelled, colour, centre, and friendly date formats.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="2-how-to-play-quick-start">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">2. How to play (quick start)</h2>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Open your <strong>personal Join link</strong>. Your name should already be picked. Set your own email and password — once. Stay signed in on this phone. If the seat is already claimed, Sign in instead. New joiners not on the list can create a unique nickname.</li>
          <li>Open **Pick** and choose from **This week’s games** — pick **exactly one** NFL team to win. Use the arrows beside the **W#** badge in the header to flip to other weeks.</li>
          <li>Submit before the **Pick deadline** (header countdown) — the week locks at the kickoff of the first game that week (usually Thursday Night Football). **Week 1 only:** you can still change your pick until **that team’s** kickoff, as long as the new game has not started either. **When that game starts, next week opens for you immediately** (no waiting for Monday Night Football). If you join after that week has already locked and you never had a pick path, the next week is the obvious next action. After Week 1 this extra change window goes away. Past weeks stay read-only after lock.</li>
          <li>If your team wins, you survive. If it loses, your mulligan absorbs the first hit (you’re still alive with one loss) or a second loss eliminates you.</li>
          <li>You **cannot reuse** any team you’ve already picked — win or lose.</li>
          <li>Last friends standing win the bragging rights (and whatever your group agreed offline).</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">That’s the whole game. The rest of this help fills in the edges.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="walkthrough">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">App walkthrough</h2>
        <p className="text-[var(--text-muted)] mb-4">A visual tour of the main screens you&apos;ll use each week.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 space-y-0">
          {[
            { src: '/help-preview/01-login.png', alt: 'Sign in screen', caption: 'Sign in (email me a code, or password)' },
            { src: '/help-preview/02-pool-home.png', alt: 'Pool home / Board entry', caption: 'Pool home / Board entry' },
            { src: '/help-preview/03-pick-this-weeks-games.png', alt: 'Pick — This week’s games', caption: 'Pick — This week’s games' },
            { src: '/help-preview/04-team-research.png', alt: 'Team research', caption: 'Team research' },
            { src: '/help-preview/05-team-news.png', alt: 'Team news', caption: 'Team news' },
            { src: '/help-preview/06-league-standings.png', alt: 'League standings with 2025 rank', caption: 'League standings (with 2025 rank)' },
            { src: '/help-preview/07-board-survival.png', alt: 'Board — survival standings', caption: 'Board — survival standings' },
            { src: '/help-preview/08-change-pick.png', alt: 'Change pick', caption: 'Change pick' },
            { src: '/help-preview/09-schedule.png', alt: 'Schedule with week dropdown', caption: 'Schedule (week dropdown)' },
          ].map((item) => (
            <figure key={item.src} className="card-glass p-3 space-y-2">
              <img
                src={item.src}
                alt={item.alt}
                className="w-full rounded-lg border border-stadium-border"
              />
              <figcaption className="text-xs text-[var(--text-muted)] text-center">{item.caption}</figcaption>
            </figure>
          ))}
        </div>
        <p className="text-[var(--text-muted)] mb-2 mt-4">---</p>
      </section>

      <section id="3-core-rules">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">3. Core rules</h2>
        <h3 className="font-semibold mt-3 mb-1">One pick per week</h3>
        <p className="text-[var(--text-muted)] mb-2">While you’re still alive (`undefeated` or `one_loss`), you select exactly one team to win that week’s game. No doubles, no hedges — one pick, one fate.</p>
        <h3 className="font-semibold mt-3 mb-1">No team reuse</h3>
        <p className="text-[var(--text-muted)] mb-2">Any team you pick is struck from your list for the rest of the season, whether that pick won or lost. Plan ahead: burning a favourite early might leave you scrambling in December.</p>
        <p className="text-[var(--text-muted)] mb-2">**Bye-week teams are unavailable.** The picker disables them so you can’t select a club that isn’t playing.</p>
        <h3 className="font-semibold mt-3 mb-1">One mulligan (unless the commissioner turns it off)</h3>
        <p className="text-[var(--text-muted)] mb-2">Everyone starts with **one** mulligan for the season. You don’t choose when to burn it — it **auto-burns** on your first wrong pick **or** on a missed pick at lock.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">After that first loss: status becomes **one loss** — you’re still in.</li>
          <li className="text-[var(--text-primary)]">A second loss: you’re **eliminated**.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">There’s no manual “save my mulligan for later” switch.</p>
        <p className="text-[var(--text-muted)] mb-2">The commissioner can **turn off the free mulligan** from a chosen week (or immediately). From that week on, the pool is **one-and-done**: one loss or a missed pick puts you out. A gold banner says **From Week X: no mulligan / one-and-done.** Already-scored weeks stay as they were — nobody is retroactively eliminated. If you already used your mulligan (**One loss**), you stay in; your next loss still puts you out.</p>
        <h3 className="font-semibold mt-3 mb-1">Lock time</h3>
        <p className="text-[var(--text-muted)] mb-2">The week locks at the **kickoff of the first scheduled game** that week. After lock:</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Week 1 only:** you may change an existing pick to another team whose game has **not started yet**, as long as **your current pick’s game has also not started**. Once that kickoff starts (or the game is live/final), the pick locks **and the next week’s picks open for you** — you do not wait until Monday Night Football. A missed first pick at lock still counts as a miss — this is not a late first-pick window.</li>
          <li className="text-[var(--text-primary)]">**Weeks 2+ keep the normal lock:** no pick changes after first kickoff, unless the commissioner reopens the week. You can still make that week’s pick as soon as your previous week’s pick is locked.</li>
          <li className="text-[var(--text-primary)]">**New joiners after a deadline:** if you never had a pick path for the locked week, Pick goes to the **next** week (for example **Week 2 is open — make your pick**). The header will not strand you on “Deadline passed.”</li>
          <li className="text-[var(--text-primary)]">Late pickers who never selected take an automatic loss (mulligan applies if you still have it).</li>
          <li className="text-[var(--text-primary)]">Everyone’s picks become visible.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">Your commissioner can override lock time for testing or rare schedule quirks — see [For commissioners](#14-for-commissioners-admins).</p>
        <h3 className="font-semibold mt-3 mb-1">Ties &amp; postponements</h3>
        <p className="text-[var(--text-muted)] mb-2">If your picked team’s game ends in a **tie** (after overtime), it counts as a **loss** unless a pool admin overrides. Postponed or **cancelled** games: your commissioner decides how to resolve — ask them, or check the pool notice.</p>
        <h3 className="font-semibold mt-3 mb-1">Season end</h3>
        <p className="text-[var(--text-muted)] mb-2">We prefer a **sole survivor**. The official winner must have a **clean** season: **no 💩 stamps**. Ranked auto-pick (~2 minutes before lock) is for staying in for fun when you are busy — it keeps you on the board but you cannot win the pool. Copy-from-member, your own picks, and commissioner import / fix-pick do **not** stamp. If more than one **eligible** player is still alive after Week 18, apply this ladder:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>**Clean record** (no ranked auto-pick 💩).</li>
          <li>**Fewest losses** (undefeated beats one loss).</li>
          <li>**Most weeks survived**.</li>
          <li>Still tied → **shared win** (co-champions). Nickname A–Z is only for list order — it does not crown a sole winner.</li>
          <li>**Optional backup:** the commissioner may run **one extra pick week** among only the tied eligible players if the group wants a sole champ.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="4-seeing-others-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">4. Seeing others’ picks</h2>
        <p className="text-[var(--text-muted)] mb-2">**Before lock:** you only see your own pick (or an empty “still deciding” state). Everyone else shows as hidden — think silhouettes and “reveals after kickoff.” The Board, Home, and Scores still list people by **same pick** (team abbreviation; no pick last), then **same game** (earlier kickoff first), then nickname **A–Z**. Status chips stay on each row — they do **not** split a pick group.</p>
        <p className="text-[var(--text-muted)] mb-2">**After lock:** all picks for the week are revealed. Home shows **Picks by game**; Scores lists **Participants’ picks**. Both use the **same board order** as Standings:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Games ordered by **kickoff** (earliest first)  </li>
          <li>Under each game — **same-pick clusters**: away-side pickers, then home-side pickers  </li>
          <li>Within each cluster (and on Scores / Missed / no pick) — nickname **A–Z**, with status chips (and graded result when available). Same pick stays together even if one friend is undefeated and another has a loss.  </li>
          <li>At the bottom — a **Missed / no pick** group for anyone who missed lock or never picked</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">That way you can see who stacked the same team, without undefeated / one-loss splitting a pick group.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="5-status-badges">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">5. Status badges</h2>
        <pre className="card-glass p-3 text-xs overflow-x-auto whitespace-pre-wrap mb-2">| Badge | Meaning |
|-------|---------|
| **Undefeated** | No losses yet; mulligan still unused. |
| **One loss** | Mulligan used; you’re still fighting. |
| **Eliminated** | Out for the season — you can still follow the pool and cheer (or roast) from the sidelines. |</pre>
        <p className="text-[var(--text-muted)] mb-2">Your badge updates when results grade or when a missed pick at lock is applied.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="6-head-to-head-h2h">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">6. Head-to-head (H2H) <span className="text-sm font-normal text-[var(--text-muted)]">— Wave 2 · Coming soon</span></h2>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming soon in Wave 2:</strong> H2H highlights for opposite picks, including the planned boxing-gloves animation. This is not available in the current Wave 1 experience.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="7-banter">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">7. Banter <span className="text-sm font-normal text-[var(--text-muted)]">— Wave 2 · Coming soon</span></h2>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming soon in Wave 2:</strong> weekly and season banter, mute controls, and the planned one-way WhatsApp group stub. These chat and messaging features are not available now.</p>
        <p className="text-[var(--text-muted)] mb-2">When released, keep it friendly; commissioners may remove abusive messages.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="8-notifications">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">8. Notifications</h2>
        <p className="text-[var(--text-muted)] mb-2"><strong>Where:</strong> <strong>Account → Notification preferences</strong> (header Account menu). Same path for a Player-only login and for a dual-role login (Player + Admin). You can also open it from this Help page when you are signed in.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Your choices:</strong> each signed-in friend picks what they want. Core items start <strong>on</strong> (missing-pick reminder, pick saved/changed, results, you’re out / mulligan used, pool notes). Optional noisier items start <strong>off</strong> (live score updates, injury notes). Phone / Home Screen push is listed as coming soon. Tap <strong>Save preferences</strong> after you change a toggle.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Cell for missing-pick texts:</strong> after sign-in we ask for a Canadian or US cell number so we can text you if you haven’t picked before lock. Add your cell for SMS reminders. You can add or change it later from Account (<strong>Add cell</strong>). If you turn <strong>Missing pick reminder</strong> off, we will not email or text that reminder. Password-reset codes still send when you ask for one. Numbers are stored in E.164. WhatsApp is later.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Pick backup:</strong> Account → <strong>Pick backup</strong> (or Admin → Roster). Off by default. (1) Optional copy-from-member: if you still have <strong>no pick</strong> within <strong>30 minutes</strong> of lock (Week 1: that pick’s kickoff), copy another member’s pick. Copy-from-member does <strong>not</strong> add a 💩. (2) Optional ranked leftover: auto-pick the best unused team by <strong>2025 rank #N</strong> (same prior-year composite Pick shows; 1 = strongest), skipping used teams and byes, if you still have none within <strong>about 2 minutes</strong> of lock. That ranked leftover <strong>does</strong> stamp 💩 beside your nickname (repeat, or 💩×N) and you cannot be the official winner. We never overwrite a pick you already submitted. Server jobs apply this — opening the app is not required.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming later:</strong> weekly picks digests, WhatsApp messaging, and close-game alerts. Those are not the same as the preference toggles already in Account.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="9-live-scores-digests">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">9. Live scores &amp; digests</h2>
        <p className="text-[var(--text-muted)] mb-2"><strong>Scores</strong> pulls live and final results from ESPN while games are on, and refreshes during kickoff windows (Home, Scores, Pick, Schedule). When a game reaches <strong>final</strong>, picks auto-grade. The clock is ESPN’s published period / time remaining (or short detail) — we do not invent one.</p>
        <p className="text-[var(--text-muted)] mb-2">Use the week dropdown (and arrows) to check past weeks. Live games keep team names and scores, with a TV-style strip: <strong>down &amp; distance</strong> (for example <strong>1ST &amp; 10</strong>) and <strong>quarter and clock</strong> (for example <strong>4TH | 9:00</strong>) from ESPN. A <strong>🏈</strong> beside the abbreviation (and a gold bar) marks who has the ball; the yard line (for example <strong>MIN 42</strong>) shows when ESPN has it. If the clock is missing, ESPN’s short status is used (for example <strong>END 2ND</strong> / <strong>HALF</strong>). Finals show <strong>Final</strong>. Upcoming games show today’s kickoff time (ET). ESPN team logos sit beside the abbreviations on <strong>Scores</strong>, <strong>Pick</strong>, the <strong>Board</strong>, and <strong>League</strong> (and on each friend’s pick under Scores). <strong>Tap Details</strong> on a game — live or Final — (right side of the card) for timeouts, scoring plays, drives, leaders when ESPN has them, and <strong>YouTube highlights</strong> when NFL has posted them. Team logos still open that team’s research page.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming later:</strong> weekly picks digests and close-game alerts.</p>
        <p className="text-[var(--text-muted)] mb-2">If a score or grade looks wrong, pull to refresh; if it’s still off, ping your commissioner.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="videos">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Videos</h2>
        <p className="text-[var(--text-muted)] mb-2">Header <strong>Videos</strong> (next to Schedule) lists this week’s official YouTube clips in short / medium / longer groups — thumbnails first, then the normal YouTube player (fullscreen included). Home also shows a few title cards. Clips are <strong>this 2026/27 season only</strong> (older years and archive / throwback videos are skipped). If a clip won’t play in the app, tap <strong>Open in YouTube</strong>.</p>
        <p className="text-[var(--text-muted)] mb-2">On <strong>Scores</strong>, open a game’s <strong>Details</strong> for that matchup’s highlights while it is live or after it is Final. Videos are extra research — a missing clip never blocks picks, scores, or grading.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="share-board-scores">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Share Board &amp; Scores as a picture</h2>
        <p className="text-[var(--text-muted)] mb-2">Handy for the group text. There is <strong>no Share button</strong> on the screen (so it does not show up in a regular screenshot). On <strong>Board</strong> or <strong>Scores</strong>: <strong>press and hold the page title</strong>, or <strong>tap the week label three times</strong> (the gold <strong>W#</strong> up top, or the week words in the title). Then pick what to include and tap <strong>Make picture</strong>. Save the image, or tap <strong>Send…</strong> when your phone offers it. Works in the Home Screen app and in mobile Safari / Chrome, and on a computer.</p>
        <p className="text-[var(--text-muted)] mb-2">You always have a choice — we never force one format:</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]"><strong>Full long picture</strong> (always listed): the whole Board or the whole Scores page, like a Safari long screenshot — one tall image you can scroll in the preview.</li>
          <li className="text-[var(--text-primary)]"><strong>Shorter options:</strong> on Board, this week’s picks, still in, or undefeated only. On Scores, scores only, this week’s picks, or live games only (when a game is on).</li>
          <li className="text-[var(--text-primary)]"><strong>A few shorter pictures:</strong> if the page is very long, we also offer a split (for example scores, then picks). The full long picture stays in the list.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">The picture is the Board or Scores content only — header, bottom tabs, Change pick, <strong>Details ›</strong>, “tap for details,” and other chrome are left off. Before lock, other friends’ picks stay hidden in the picture too. If making the picture fails on an older phone, pick a shorter option or take a regular screenshot.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="10-team-pages">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">10. League, Schedule &amp; team research</h2>
        <p className="text-[var(--text-muted)] mb-2">
          **League** shows NFL standings (by division / overall).
          {showDemoCopy
            ? " Demo mode may show a practice table."
            : " **W-L** is this season from ESPN."}{" "}
          The **2025 rank** column is last season’s composite power rank by team (1 = strongest, 32 = weakest) — research only, not this year’s W-L.
        </p>
        <p className="text-[var(--text-muted)] mb-2">**Schedule** lists this week’s games and future weeks (dropdown + arrows). Tap a team for research.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Team pages</strong> start with the team&apos;s record, this week&apos;s game, head coach (name + ESPN / Wikipedia links), and style, then key NFL players, full roster, an ESPN injury report (Out / Doubtful / Questionable / IR / suspension), and news headlines. Tap a <strong>player name</strong> for college, depth role, and any ESPN injury note. Injury chips on Pick / Home / Schedule are a compact count — tap the team for names. This is ESPN&apos;s public list, not the official NFL club report.</p>
        <p className="text-[var(--text-muted)] mb-2">From <strong>This week&apos;s games</strong>, logos and names open research; <strong>Pick</strong> stays on its own button.</p>
        <p className="text-[var(--text-muted)] mb-2">Spreads and favourites in the pick flow are informational only.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="11-install-the-app-pwa">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">11. Install the app (PWA)</h2>
        <p className="text-[var(--text-muted)] mb-2">Survive Sunday works in a phone browser, on a computer, or as a Home Screen app. After you Join or Sign in once, you stay signed in on that device — open the icon and you’re in the pool. We do not ask for a code every time.</p>
        <p className="text-[var(--text-muted)] mb-2">After you Join or first Sign in on a phone browser, we may ask about the Home Screen. Tap <strong>Yes</strong>, <strong>Show me how</strong>, or <strong>Not now</strong>. If you already open the app from the Home Screen icon, we do not nag.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]"><strong>iPhone / iPad (Safari):</strong> stay in Safari (not Chrome, and not the browser inside Messages). Tap the Share button (square with an arrow) → <strong>Add to Home Screen</strong> → Add. iPhone cannot install with a single button — those Share steps are the way.</li>
          <li className="text-[var(--text-primary)]"><strong>Android (Chrome):</strong> stay in Chrome. If you see <strong>Install</strong>, tap it. Or the three-dot menu → <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
          <li className="text-[var(--text-primary)]"><strong>Computer:</strong> any modern browser works. Bookmark the pool if you like.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">You’ll get the dark “stadium” theme and an offline shell so the chrome still loads when the network blips. Live scores and pick submits need a connection. If the Home Screen icon opens logged-out, Sign in once inside that icon.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="12-privacy-accounts">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">12. Privacy &amp; accounts</h2>
        <p className="text-[var(--text-muted)] mb-2">Pools are <strong>private and invite-only</strong>. Join with a <strong>personal Join link</strong>, then Sign in with a <strong>sign-in code</strong> (or your password).</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">Your **nickname** is what the pool sees — it must be **unique within the pool** (case doesn’t matter). Returning BM Boys already have one seeded; tap **Account** in the header, then **Change nickname**. New members create a nickname when they join.</li>
          <li className="text-[var(--text-primary)]">**Real name** is optional — handy when friends already know each other offline.</li>
          <li className="text-[var(--text-primary)]">**Cell number:** add your cell for SMS missing-pick reminders and for password-reset texts. You can add or edit it later from Account. Missing-pick texts follow your Notification preferences; password-reset codes do not.</li>
          <li className="text-[var(--text-primary)]">**Notification preferences:** <strong>Account → Notification preferences</strong>. Save the toggles you want. Defaults are safe for friends (core on, noisy off).</li>
          <li className="text-[var(--text-primary)]">
            <strong>Sign-in code:</strong> Sign in starts here. Enter the email you Joined with, then tap <strong>Email me a sign-in code</strong>. Know your password? Tap <strong>Use password instead</strong>. We do <strong>not</strong> ask for a code every time you open the app.
            {showDemoCopy
              ? " Demo seats (@survivesunday.demo) always use password demo1234."
              : ""}
          </li>
          <li className="text-[var(--text-primary)]">
            <strong>Forgot password:</strong> only after you have Joined. On Sign in, tap <strong>Use password instead</strong>, then the small <strong>Forgot password?</strong> link.
            {showDemoCopy
              ? " Demo seats (@survivesunday.demo) always use password demo1234 — no reset needed."
              : " Don’t use Forgot password before Join — there is no account yet."}
          </li>
          <li className="text-[var(--text-primary)]">**Sign out:** tap <strong>Account</strong> in the header (top right), then <strong>Sign out</strong>. It is also on Admin and this Help page. One tap signs you out and takes you to Sign in.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">To leave a pool or request data deletion, use the account/privacy controls (or contact your commissioner) and see the privacy policy stub linked from settings.</p>
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
| Sign-in code did not arrive | Sign in → Email me a sign-in code. Use the Join email. The page now shows the real Resend reason if keys are missing or the From address is still onboarding@resend.dev. Commissioner: Admin shows Sign-in and reset emails status. |
| Forgot password | Sign in → Use password instead → Forgot password?${showDemoCopy ? " Demo seats use demo1234." : ""} If sending fails, read the red text — do not assume the code is in spam until the page said it was sent. |
| Friend stuck (no code) | Commissioner: Admin → Set a temporary password (claimed seats only). Text them that password. They Sign in → Use password instead. If they have not Joined, send their personal Join link instead. |
| Home Screen prompt keeps asking | Tap Yes if you already added the icon. Opening from the icon should not nag. |
| Asked to sign in again | Use the same phone/browser you signed in on. Add to Home Screen (Help §11). Session lasts about 90 days. |
| Want to switch account | Header → Account → Sign out (also on Admin and Help). Then Sign in. |
| Scores look wrong | Pull to refresh; if a final grade seems off, report it to your admin. |
| Share picture failed | Press and hold the Board or Scores title (or triple-tap the week). Try a shorter option. Or take a regular screenshot. |
| Gloves animation missing | Wave 2 — the H2H boxing-gloves animation is coming soon. |
| Deadline passed / empty Pick | That week’s first kickoff has gone. If **your** game has started (or you never had a pick path), open **Pick** — next week should already be available (**Week 2 is open — make your pick**). You do not wait for Monday Night Football. |
| Can’t change my pick | Weeks 2+ freeze at week lock. Week 1: you can still change until your pick’s kickoff, but only onto a game that has not started. Once that game starts, make next week’s pick instead. |`}</pre>
        <p className="text-[var(--text-muted)] mb-2">Still stuck? Ask your commissioner or check the pool notice for schedule overrides.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="14-for-commissioners-admins">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">14. For commissioners (admins)</h2>
        <p className="text-[var(--text-muted)] mb-2">You’re the light touch that keeps the pool fair:</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]"><strong>Share the Board or Scores (quiet):</strong> no Share button on the screen. Press and hold the page title, or tap the week label (gold <strong>W#</strong>) three times → pick full long picture or a shorter option → Make picture → Save or Send. Click-by-click in <a href="#share-board-scores" className="text-gold-400">Share Board &amp; Scores</a>.</li>
          <li className="text-[var(--text-primary)]"><strong>Personal Join links:</strong> Admin → Copy next to that friend → send that one person their link. Do <strong>not</strong> blast one link to the group chat. Click-by-click in <a href="#getting-started-join-signin-home-screen" className="text-gold-400">Getting started</a>.</li>
          <li className="text-[var(--text-primary)]">Open weeks and confirm the schedule import.</li>
          <li className="text-[var(--text-primary)]">**Import prior picks** (CSV or form) when the season is already underway — see [Importing prior picks](#15-importing-prior-picks).</li>
          <li className="text-[var(--text-primary)]">**Override lock time** when needed (testing or rare schedule changes).</li>
          <li className="text-[var(--text-primary)]">Manual overrides for ties, postponements, and **force-resolve** edge cases.</li>
          <li className="text-[var(--text-primary)]">**Remove players** who shouldn’t be in the pool.</li>
          <li className="text-[var(--text-primary)]">**Roster:** open **Admin → Roster** to see every nickname and real name, and fix either if it’s wrong. Each change is audit-logged. You can also set <strong>Pick backup</strong> (off, optional copy-from-member if no pick within 30 minutes — no 💩 — or optional best unused 2025-rank team within about 2 minutes, which stamps 💩). Official winner must be 💩-free.</li>
          <li className="text-[var(--text-primary)]">**Roles:** one login can be a **Player** and an **Administrator**. If you have both, use **Playing as …** / **Admin tools** to switch. Players without Admin never see Admin tools. You can **Make administrator** for someone already in the pool (they stay on the board). The pool always keeps at least one administrator. A later **Watcher** role (follow the board, no picks) is reserved and not in the app yet.</li>
          <li className="text-[var(--text-primary)]">**Turn off the free mulligan** (one-and-done from a chosen week). Already-graded weeks are not re-scored. People who already used a mulligan stay in with one loss.</li>
          <li className="text-[var(--text-primary)]">**Hand the pool to someone else** — transfer Admin to another member who is already in the pool. You stay as a player and lose Admin. They keep their picks and stay on the board. This is different from **Make administrator**, which lets more than one person have Admin tools.</li>
          <li className="text-[var(--text-primary)]">**Pool notes & missing-pick nudge:** Admin → send a short note (only friends who left Pool notes on) or nudge anyone still without a pick (only if they left Missing pick reminder on).</li>
          <li className="text-[var(--text-primary)]"><strong>Coming later:</strong> weekly digests. Late-pick reminders already respect Notification preferences.</li>
          <li className="text-[var(--text-primary)]"><strong>Set a temporary password:</strong> Admin → pick a friend who already Joined → type their nickname → save a password → text it to them. Audit-logged. Does <strong>not</strong> email the password. If they have not Joined, send their personal Join link instead.</li>
          <li className="text-[var(--text-primary)]"><strong>Forgot password</strong> and <strong>sign-in codes</strong> use the same Resend keys (owner sets them on Vercel Production). Admin shows whether those keys look set. Optional Twilio for texts if a cell is saved. <strong>Wave 2 — Coming soon:</strong> WhatsApp group stub.</li>
          {showDemoCopy && (
            <li className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> mark demo-mode team data so “demo” labels stay honest.</li>
          )}
        </ul>
        <h3 className="font-semibold mt-3 mb-1">Turn off the mulligan (one-and-done)</h3>
        <p className="text-[var(--text-muted)] mb-2">Open **Admin → Pool rules — mulligan**. Tick the box, choose the starting week (this week or later — or an earlier week if you only want the label; old games are not re-scored), and save. Confirm the prompt.</p>
        <p className="text-[var(--text-muted)] mb-2">You can turn the free mulligan back on the same way. That does not revive anyone already eliminated.</p>
        <h3 className="font-semibold mt-3 mb-1">Hand the pool to someone else</h3>
        <p className="text-[var(--text-muted)] mb-2">Open **Admin → Hand the pool to someone else**. Pick a person who is already a member, type their nickname, tick the confirmation box, and confirm. You stay in the pool as a player and lose Admin. They keep their picks and get the Admin screen. This is different from **Make administrator**, which lets both of you keep Admin tools. If nobody else is in the pool yet, the app will not let you transfer — that would lock everyone out.</p>
        <h3 className="font-semibold mt-3 mb-1">Set a temporary password (stuck friend)</h3>
        <p className="text-[var(--text-muted)] mb-2">When a friend already Joined but cannot get a sign-in or reset code (codes need Resend keys), open **Admin → Set a temporary password**.</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Pick their nickname (example: <strong>Cannoli Stuffer</strong> / Mike Frigo). Only people who already Joined appear.</li>
          <li className="text-[var(--text-primary)]">Type that nickname again to confirm.</li>
          <li className="text-[var(--text-primary)]">Tap <strong>Suggest a password I can text</strong>, or type one (at least 6 characters).</li>
          <li className="text-[var(--text-primary)]">Save. Copy it. <strong>Text it to them yourself</strong> — the app does not email it.</li>
          <li className="text-[var(--text-primary)]">They open Sign in → <strong>Use password instead</strong> → that password.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">If the name is greyed out or missing, they have <strong>not Joined</strong> yet. Copy their personal Join link instead of a password. This change is audit-logged (nickname only — never the password).</p>
        <p className="text-[var(--text-muted)] mb-2">**Important:** you cannot silently edit another player’s pick. Any such change must leave an **audit log** entry visible to the pool.</p>
        <p className="text-[var(--text-muted)] mb-2">Remind the group: this is entertainment among friends — no in-app betting.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="15-importing-prior-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">15. Importing prior picks</h2>
        <p className="text-[var(--text-muted)] mb-2">Week 1 (or more) may already be underway when your pool jumps into Survive Sunday. Commissioners can **import prior picks** so history matches reality — without asking everyone to re-enter locked weeks by hand.</p>
        <h3 className="font-semibold mt-3 mb-1">What gets imported
- Each player’s team pick for one or more past (or in-progress) weeks.
- Results that have already graded, when you include them.</h3>
        <h3 className="font-semibold mt-3 mb-1">What those picks count for
Imported picks are real pool data. They affect:</h3>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Lock visibility** — once a week is treated as locked, everyone’s picks for that week show like a normal post-lock week.</li>
          <li className="text-[var(--text-primary)]">**Grading** — wins and losses update status the same way live weeks do.</li>
          <li className="text-[var(--text-primary)]">**Mulligan** — a first wrong (or missed) imported pick still auto-burns the mulligan → **one loss**.</li>
          <li className="text-[var(--text-primary)]">**Team reuse** — imported teams are struck from that player’s list for the rest of the season.</li>
          <li className="text-[var(--text-primary)]">**Standings** — the board sorts **same pick** (no pick last), then **same game** (earlier kickoff first), then nickname A–Z, using the imported history. Status chips still show; they do not split a pick group.</li>
        </ul>
        <h3 className="font-semibold mt-3 mb-1">How commissioners do it
1. Open the admin **Import prior picks** flow (CSV upload or on-screen form).
2. Map each row to a nickname, week, and team (use official abbreviations).
3. Review the preview — especially mulligan burns and anyone who would already be eliminated.
4. Confirm. The import is **audit-logged** so the pool can see that history was backfilled (not a silent edit).</h3>
        <h3 className="font-semibold mt-3 mb-1">For players
You don’t need to re-pick locked weeks. After import, check your status badge and used-teams list. If something looks off, ping your commissioner — they’ll correct it with another audited change, not a quiet rewrite.</h3>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="16-glossary">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">16. Glossary</h2>
        <pre className="card-glass p-3 text-xs overflow-x-auto whitespace-pre-wrap mb-2">| Term | Meaning |
|------|---------|
| **Pick deadline** | Header countdown to lock — first kickoff of the week. After that, everyone’s picks reveal. **Your next week opens when your own pick is locked** (your game started), not after Monday Night Football. |
| **Lock** | Same moment as the pick deadline for the group board. Week 1 only: you can still change an existing pick until that team’s kickoff. When that game starts, next week’s picks open for you. |
| **This week’s games** | The list of matchups you pick from on the Pick screen (not “slate”). |
| **Board** | Pool board: same pick (team abbr; no pick last), then same game (earlier kickoff), then nickname A–Z. Status chips show on each row but do not split a pick group. After lock, Home still groups by kickoff-ordered games then away/home clusters; each cluster (and Scores’ pick list) uses that same order. |
| **Share (picture)** | Board or Scores: press and hold the title, or triple-tap the week label. No Share button on the screen. Full long picture is always offered. |
| **2025 rank** | Last season’s composite power rank (1 = strongest). Research only. |
| **Mulligan** | One free pass that auto-absorbs your first loss (or missed pick at lock), unless the commissioner turns it off. |
| **One-and-done** | Commissioner rule: from a chosen week, one loss (or missed pick) puts you out. Banner: “From Week X: no mulligan / one-and-done.” |
| **Transfer commissioner** | Current admin gives Admin to another pool member and stays as a player. Different from Make administrator (that keeps both people as Admin). |
| **Notification preferences** | Account → Notification preferences. Toggles for which emails (and missing-pick texts) you want. |
| **Pick backup** | Optional: copy-from-member if no pick within 30 minutes (no 💩), or best unused 2025-rank team within ~2 minutes (stamps 💩). Official winner must be 💩-free. |
| **Auto-pick 💩** | Stamp only when the ~2-minute ranked leftover writes a pick. Shown beside the nickname on Board / Home. Clean record required to win. |
| **Digest** | **Coming later:** post-lock summary of everyone’s picks. |
| **H2H** | **Coming later:** head-to-head spotlight when two participants pick opposite sides. |
| **en-CA** | Canadian English locale for copy, dates, and A–Z sorting. |
| **Import (prior picks)** | Commissioner backfill of earlier weeks so mulligan, reuse, and standings stay honest. |
| **Personal Join link** | A per-person URL from Admin that opens Join with that seat already picked. If the seat is claimed, it points to Sign in. |
| **Sign-in code** | 6-digit email/text code on Sign in. Not a code at every login. Join first. Password is under Use password instead. |
| **Undefeated / one loss / eliminated** | Your survival status for the season. |</pre>
        <p className="text-[var(--text-muted)] mb-2">---</p>
        <p className="text-[var(--text-muted)] mb-2">*Help updated with the current app — Survive Sunday 2026/27 (en-CA)*</p>
      </section>
      <section id="importing-prior-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Importing prior picks</h2>
        <p className="text-[var(--text-muted)] mb-2">Week 1 of 2026/27 may already be in progress when you start using Survive Sunday. Commissioners can **import picks** the group already made outside the app (spreadsheet, group chat, etc.).</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Open **Commissioner → Import week picks**.</li>
          <li>Upload a CSV or paste rows: `nickname,team` (or `email,team`).</li>
          <li>Use the official Week 1 list in the owner handoff — not `/examples/week1-picks-import.csv` (leftover demo sample).</li>
          <li>Imported picks are marked **imported**, written to the **audit log**, and follow normal rules: visible after lock, graded when games are final, mulligan / elimination applied, team reuse enforced. Import / fix-pick does **not** add a 💩 — only the ranked auto-pick path does.</li>
          <li>If you need to force a mid-season import that reuses a team, tick the override — that is also audited.</li>
        </ol>
      </section>
      <p className="text-xs text-[var(--text-muted)] pt-4 border-t border-stadium-border">
        For entertainment among friends. Not a gambling service. Spreads and moneylines are informational only.
      </p>
    </article>
  );
}
