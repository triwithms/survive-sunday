export function HelpContent({ showDemoCopy = false }: { showDemoCopy?: boolean }) {
  return (
    <article className="prose-survive space-y-6 text-sm leading-relaxed max-w-[68ch]">
      <aside className="card-glass border border-gold-400/30 p-4 space-y-2" aria-label="Feature availability">
        <p className="text-[var(--text-primary)]"><strong>Wave 1 is live:</strong> picks, mulligan, lock and pick privacy, standings, scores and grading, League, Schedule, team research, prior-pick import, commissioner admin, PWA install, joining, sign-in that stays on your phone, forgot-password codes (email or text), cell-number collection, and <strong>notification preferences</strong> (Account → choose which emails and missing-pick texts you want).</p>
        <p className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> H2H boxing gloves, banter and mute, WhatsApp, weekly digests, and close-game alerts.</p>
      </aside>
      <section id="onboarding-first-run">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Onboarding first-run</h2>
        <p className="text-[var(--text-muted)] mb-2">Welcome to Survive Sunday — your private NFL survivor pool for the 2026/27 season.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Pick one team each week** to win. You can’t reuse a team you’ve already picked, and bye-week teams are off the board.</li>
          <li className="text-[var(--text-primary)]">**Lock is first kickoff** (often Thursday night). After lock, everyone’s picks go public. **Week 1 only:** you can still change an existing pick until that team’s kickoff if the new game has not started. After Week 1 that extra window goes away.</li>
          <li className="text-[var(--text-primary)]">**You get one mulligan.** Your first wrong pick (or a missed pick at lock) burns it and you’re still in with one loss. A second loss eliminates you.</li>
          <li className="text-[var(--text-primary)]">**Invite link**, then pick **yourself from the live roster** (nickname + real name). Set your own email and password — this attaches to your existing seat so your Week 1 picks stay with you. If that name is already claimed, **Sign in** instead (or ask the commissioner). You stay signed in on that phone or computer. Forgot the password? Use **Forgot password** on the sign-in page — we email or text a code. Returning BM Boys: tap **Account** in the header, then **Change nickname**. New joiners who are not on the list can join as a new player (unique nickname).</li>
          <li className="text-[var(--text-primary)]"><strong>Live scores and standings</strong> show how the pool is progressing. Add a <strong>cell number</strong> for missing-pick texts (you can skip and change it later in the header). Choose what we send under <strong>Account → Notification preferences</strong>. Wave 2 social features are marked below as coming soon.</li>
        </ul>
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
          <li>Join with your **invite code** (`SUNDAY26`). Pick **your name** from the roster, then set your own email and password. Returning BM Boys: your nickname and Week 1 picks stay on that seat — tap **Account** then **Change nickname** if you want something different. If the seat is already claimed, sign in instead. New joiners who are not on the list can create a unique nickname.</li>
          <li>Open **Pick** and choose from **This week’s games** — pick **exactly one** NFL team to win. Use the arrows beside the **W#** badge in the header to flip to other weeks.</li>
          <li>Submit before the **Pick deadline** (header countdown) — the week locks at the kickoff of the first game that week (usually Thursday Night Football). **Week 1 only:** you can still change your pick until **that team’s** kickoff, as long as the new game has not started either. After Week 1 this extra change window goes away. Past weeks stay read-only after lock; future weeks show that week’s games if they’re already in the app.</li>
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
            { src: '/help-preview/01-login.png', alt: 'Sign in screen', caption: showDemoCopy ? 'Sign in (demo or Google)' : 'Sign in (Google or email)' },
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
        <h3 className="font-semibold mt-3 mb-1">One mulligan</h3>
        <p className="text-[var(--text-muted)] mb-2">Everyone starts with **one** mulligan for the season. You don’t choose when to burn it — it **auto-burns** on your first wrong pick **or** on a missed pick at lock.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">After that first loss: status becomes **one loss** — you’re still in.</li>
          <li className="text-[var(--text-primary)]">A second loss: you’re **eliminated**.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">There’s no manual “save my mulligan for later” switch.</p>
        <h3 className="font-semibold mt-3 mb-1">Lock time</h3>
        <p className="text-[var(--text-muted)] mb-2">The week locks at the **kickoff of the first scheduled game** that week. After lock:</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Week 1 only:** you may change an existing pick to another team whose game has **not started yet**, as long as **your current pick’s game has also not started**. Once that kickoff starts (or the game is live/final), the pick locks. A missed first pick at lock still counts as a miss — this is not a late first-pick window.</li>
          <li className="text-[var(--text-primary)]">**Weeks 2+ keep the normal lock:** no pick changes after first kickoff, unless the commissioner reopens the week.</li>
          <li className="text-[var(--text-primary)]">Late pickers who never selected take an automatic loss (mulligan applies if you still have it).</li>
          <li className="text-[var(--text-primary)]">Everyone’s picks become visible.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">Your commissioner can override lock time for testing or rare schedule quirks — see [For commissioners](#14-for-commissioners-admins).</p>
        <h3 className="font-semibold mt-3 mb-1">Ties &amp; postponements</h3>
        <p className="text-[var(--text-muted)] mb-2">If your picked team’s game ends in a **tie** (after overtime), it counts as a **loss** unless a pool admin overrides. Postponed or **cancelled** games: your commissioner decides how to resolve — ask them, or check the pool notice.</p>
        <h3 className="font-semibold mt-3 mb-1">Season end</h3>
        <p className="text-[var(--text-muted)] mb-2">We prefer a **sole survivor**. If more than one player is still alive after Week 18, apply this ladder:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>**Fewest losses** (undefeated beats one loss).</li>
          <li>**Most weeks survived**.</li>
          <li>Still tied → **shared win** (co-champions). Nickname A–Z is only for list order — it does not crown a sole winner.</li>
          <li>**Optional backup:** the commissioner may run **one extra pick week** among only the tied players if the group wants a sole champ.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="4-seeing-others-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">4. Seeing others’ picks</h2>
        <p className="text-[var(--text-muted)] mb-2">**Before lock:** you only see your own pick (or an empty “still deciding” state). Everyone else shows as hidden — think silhouettes and “reveals after kickoff.” The Board still lists participants in a **status ladder**: **undefeated → one loss → eliminated**, then most weeks survived, then fewest losses, then same pick, then same game (earlier kickoff first), then nickname **A–Z**.</p>
        <p className="text-[var(--text-muted)] mb-2">**After lock:** all picks for the week are revealed. The Board switches to **Picks by game**:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Games ordered by **kickoff** (earliest first)  </li>
          <li>Under each game — **same-pick clusters**: away-side pickers, then home-side pickers  </li>
          <li>Within each cluster — nickname **A–Z**, with status chips (and graded result when available)  </li>
          <li>At the bottom — a **Missed / no pick** group for anyone who missed lock or never picked</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">That way post-lock you can see who stacked the same side of each matchup, while pre-lock the board still reads like a survival ladder.</p>
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
        <p className="text-[var(--text-muted)] mb-2"><strong>Your choices:</strong> tap <strong>Account</strong> (header) → <strong>Notification preferences</strong>. Each signed-in friend picks what they want. Core items start <strong>on</strong> (missing-pick reminder, pick saved/changed, results, you’re out / mulligan used, pool notes). Optional noisier items start <strong>off</strong> (live score updates, injury notes). Phone / Home Screen push is listed as coming soon.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Cell for missing-pick texts:</strong> after sign-in you may be asked for a Canadian or US cell number so we can text you if you haven’t picked before lock. You can <strong>Skip for now</strong>; add or change it anytime from Account (<strong>Add cell</strong>). If you turn <strong>Missing pick reminder</strong> off, we will not email or text that reminder. Password-reset codes still send when you ask for one. Numbers are stored in E.164. WhatsApp is later.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming later:</strong> weekly picks digests, WhatsApp messaging, and close-game alerts. Those are not the same as the preference toggles already in Account.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="9-live-scores-digests">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">9. Live scores &amp; digests</h2>
        <p className="text-[var(--text-muted)] mb-2"><strong>Scores</strong> pulls live and final results from ESPN while games are on, and refreshes during kickoff windows (Home, Scores, Pick, Schedule). When a game reaches <strong>final</strong>, picks auto-grade. The clock is ESPN’s published period / time remaining (or short detail) — we do not invent one.</p>
        <p className="text-[var(--text-muted)] mb-2">Use the week dropdown (and arrows) to check past weeks. Live games keep team names and scores, with a TV-style strip: <strong>down &amp; distance</strong> (for example <strong>1ST &amp; 10</strong>) and <strong>quarter and clock</strong> (for example <strong>4TH | 9:00</strong>) from ESPN. A <strong>🏈</strong> beside the abbreviation (and a gold bar) marks who has the ball; the yard line (for example <strong>MIN 42</strong>) shows when ESPN has it. If the clock is missing, ESPN’s short status is used (for example <strong>END 2ND</strong> / <strong>HALF</strong>). Finals show <strong>Final</strong>. Upcoming games show today’s kickoff time (ET). Small ESPN team logos sit beside the abbreviations on <strong>Scores</strong>, <strong>Pick</strong>, and the <strong>Board</strong> (and on each friend’s pick under Scores). <strong>Tap a game</strong> for timeouts, scoring plays, drives, and leaders when ESPN has them.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming later:</strong> weekly picks digests and close-game alerts.</p>
        <p className="text-[var(--text-muted)] mb-2">If a score or grade looks wrong, pull to refresh; if it’s still off, ping your commissioner.</p>
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
        <p className="text-[var(--text-muted)] mb-2"><strong>Team pages</strong> cover roster, an ESPN injury report (Out / Doubtful / Questionable / IR / suspension), news headlines, and record. Injury chips on Pick / Home / Schedule are a compact count — tap the team for names. This is ESPN&apos;s public list, not the official NFL club report.</p>
        <p className="text-[var(--text-muted)] mb-2">From <strong>This week&apos;s games</strong>, logos and names open research; <strong>Pick</strong> stays on its own button.</p>
        <p className="text-[var(--text-muted)] mb-2">Spreads and favourites in the pick flow are informational only.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="11-install-the-app-pwa">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">11. Install the app (PWA)</h2>
        <p className="text-[var(--text-muted)] mb-2">Survive Sunday works in a phone browser, on a computer, or as a Home Screen app. After you sign in once, you stay signed in on that device — open the icon and you’re in the pool. We do not ask for a code every time.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]"><strong>iPhone / iPad (Safari):</strong> open survive-sunday.vercel.app → the Share button → <strong>Add to Home Screen</strong> → Add.</li>
          <li className="text-[var(--text-primary)]"><strong>Android (Chrome):</strong> open the site → the three-dot menu → <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
          <li className="text-[var(--text-primary)]"><strong>Computer:</strong> any modern browser works. Bookmark the pool if you like.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">You’ll get the dark “stadium” theme and an offline shell so the chrome still loads when the network blips. Live scores and pick submits need a connection.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="12-privacy-accounts">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">12. Privacy &amp; accounts</h2>
        <p className="text-[var(--text-muted)] mb-2">Pools are **private and invite-only**. Join with an invite link or code, then sign in with **Google** or **email and password**.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">Your **nickname** is what the pool sees — it must be **unique within the pool** (case doesn’t matter). Returning BM Boys already have one seeded; tap **Account** in the header, then **Change nickname**. New members create a nickname when they join.</li>
          <li className="text-[var(--text-primary)]">**Real name** is optional — handy when friends already know each other offline.</li>
          <li className="text-[var(--text-primary)]">**Cell number** is optional but recommended for missing-pick texts and for password-reset texts. You can skip the soft prompt and add or edit it later from Account. Missing-pick texts follow your Notification preferences; password-reset codes do not.</li>
          <li className="text-[var(--text-primary)]">**Notification preferences:** Account → Notification preferences. Save the toggles you want. Defaults are safe for friends (core on, noisy off).</li>
          <li className="text-[var(--text-primary)]">
            **Forgot password:** on the sign-in page, tap Forgot password. We send a 6-digit code to your email, or a text if a cell is saved.
            {showDemoCopy
              ? " Demo seats (@survivesunday.demo) always use password demo1234 — no reset needed."
              : " Use the email you joined with."}
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
| Forgot password | Sign in → Forgot password. Use the email on your account.${showDemoCopy ? " Demo seats use demo1234." : ""} |
| Asked to sign in again | Use the same phone/browser you signed in on. Add to Home Screen (Help §11). Session lasts about 90 days. |
| Want to switch account | Header → Account → Sign out (also on Admin and Help). Then Sign in. |
| Scores look wrong | Pull to refresh; if a final grade seems off, report it to your admin. |
| Gloves animation missing | Wave 2 — the H2H boxing-gloves animation is coming soon. |
| Can’t change my pick | Weeks 2+ freeze at week lock. Week 1: you can still change until your pick’s kickoff, but only onto a game that has not started. |`}</pre>
        <p className="text-[var(--text-muted)] mb-2">Still stuck? Ask your commissioner or check the pool notice for schedule overrides.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="14-for-commissioners-admins">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">14. For commissioners (admins)</h2>
        <p className="text-[var(--text-muted)] mb-2">You’re the light touch that keeps the pool fair:</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">Open weeks and confirm the schedule import.</li>
          <li className="text-[var(--text-primary)]">**Import prior picks** (CSV or form) when the season is already underway — see [Importing prior picks](#15-importing-prior-picks).</li>
          <li className="text-[var(--text-primary)]">**Override lock time** when needed (testing or rare schedule changes).</li>
          <li className="text-[var(--text-primary)]">Manual overrides for ties, postponements, and **force-resolve** edge cases.</li>
          <li className="text-[var(--text-primary)]">**Remove players** who shouldn’t be in the pool.</li>
          <li className="text-[var(--text-primary)]">**Roster:** open **Admin → Roster** to see every nickname and real name, and fix either if it’s wrong. Each change is audit-logged.</li>
          <li className="text-[var(--text-primary)]">**Roles:** one login can be a **Player** and an **Administrator**. If you have both, use **Playing as …** / **Admin tools** to switch. Players without Admin never see Admin tools. You can **Make administrator** for someone already in the pool (they stay on the board). The pool always keeps at least one administrator. A later **Watcher** role (follow the board, no picks) is reserved and not in the app yet.</li>
          <li className="text-[var(--text-primary)]">**Pool notes & missing-pick nudge:** Admin → send a short note (only friends who left Pool notes on) or nudge anyone still without a pick (only if they left Missing pick reminder on).</li>
          <li className="text-[var(--text-primary)]"><strong>Coming later:</strong> weekly digests. Late-pick reminders already respect Notification preferences.</li>
          <li className="text-[var(--text-primary)]"><strong>Forgot password email</strong> already uses Resend (owner sets the two keys on Vercel). <strong>Wave 2 — Coming soon:</strong> WhatsApp group stub.</li>
          {showDemoCopy && (
            <li className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> mark demo-mode team data so “demo” labels stay honest.</li>
          )}
        </ul>
        <p className="text-[var(--text-muted)] mb-2">**Important:** you cannot silently edit another player’s pick. Any such change must leave an **audit log** entry visible to the pool.</p>
        <p className="text-[var(--text-muted)] mb-2">Remind the group: this is entertainment among friends — no in-app betting.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
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
          <li className="text-[var(--text-primary)]">**Standings** — the board sorts **undefeated → one loss → eliminated**, then most weeks survived, then fewest losses, then same pick, then same game (earlier kickoff first), then nickname A–Z, using the imported history.</li>
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
| **Pick deadline** | Header countdown to lock — first kickoff of the week; after that picks freeze. |
| **Lock** | Same moment as the pick deadline: picks become visible and missed picks apply. After Week 1, picks also freeze then. Week 1 only: you can still change an existing pick until that team’s kickoff. |
| **This week’s games** | The list of matchups you pick from on the Pick screen (not “slate”). |
| **Board** | Pool board: status ladder (undefeated → one loss → eliminated, then weeks survived, same pick, same game, nickname A–Z); after lock, Home also groups picks by kickoff-ordered games then away/home clusters. |
| **2025 rank** | Last season’s composite power rank (1 = strongest). Research only. |
| **Mulligan** | One free pass that auto-absorbs your first loss (or missed pick at lock). |
| **Notification preferences** | Account toggles for which emails (and missing-pick texts) you want. |
| **Digest** | **Coming later:** post-lock summary of everyone’s picks. |
| **H2H** | **Coming later:** head-to-head spotlight when two participants pick opposite sides. |
| **en-CA** | Canadian English locale for copy, dates, and A–Z sorting. |
| **Import (prior picks)** | Commissioner backfill of earlier weeks so mulligan, reuse, and standings stay honest. |
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
          <li>Imported picks are marked **imported**, written to the **audit log**, and follow normal rules: visible after lock, graded when games are final, mulligan / elimination applied, team reuse enforced.</li>
          <li>If you need to force a mid-season import that reuses a team, tick the override — that is also audited.</li>
        </ol>
      </section>
      <p className="text-xs text-[var(--text-muted)] pt-4 border-t border-stadium-border">
        For entertainment among friends. Not a gambling service. Spreads and moneylines are informational only.
      </p>
    </article>
  );
}
