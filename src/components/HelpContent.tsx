export function HelpContent() {
  return (
    <article className="prose-survive space-y-6 text-sm leading-relaxed max-w-[68ch]">
      <aside className="card-glass border border-gold-400/30 p-4 space-y-2" aria-label="Feature availability">
        <p className="text-[var(--text-primary)]"><strong>Wave 1 is live:</strong> picks, mulligan, lock and pick privacy, standings, scores and grading, prior-pick import, commissioner admin, PWA install, joining, and sign-in.</p>
        <p className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> H2H boxing gloves, banter and mute, notification centre, SMS, WhatsApp, weekly digests, close-game alerts, and full team detail pages.</p>
      </aside>
      <section id="onboarding-first-run">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Onboarding first-run</h2>
        <p className="text-[var(--text-muted)] mb-2">Welcome to Survive Sunday — your private NFL survivor pool for the 2026/27 season.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">**Pick one team each week** to win. You can’t reuse a team you’ve already picked, and bye-week teams are off the board.</li>
          <li className="text-[var(--text-primary)]">**Lock is first kickoff** (often Thursday night). Submit before then; after lock, everyone’s picks go public.</li>
          <li className="text-[var(--text-primary)]">**You get one mulligan.** Your first wrong pick (or a missed pick at lock) burns it and you’re still in with one loss. A second loss eliminates you.</li>
          <li className="text-[var(--text-primary)]">**Invite link**, then **Google** or email/password to sign in. Set a nickname your friends will recognise.</li>
          <li className="text-[var(--text-primary)]"><strong>Live scores and standings</strong> show how the pool is progressing. Wave 2 social and notification features are marked below as coming soon.</li>
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
          <li>Join with your **invite link or code**, sign in with **Google** or **email and password**, then choose a nickname.</li>
          <li>Each open week, pick **exactly one** NFL team to win.</li>
          <li>Submit before the week **locks** — that’s the kickoff of the first game that week (usually Thursday Night Football).</li>
          <li>If your team wins, you survive. If it loses, your mulligan absorbs the first hit (you’re still alive with one loss) or a second loss eliminates you.</li>
          <li>You **cannot reuse** any team you’ve already picked — win or lose.</li>
          <li>Last friends standing win the bragging rights (and whatever your group agreed offline).</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">That’s the whole game. The rest of this help fills in the edges.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
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
          <li className="text-[var(--text-primary)]">No pick changes.</li>
          <li className="text-[var(--text-primary)]">Late pickers who never selected take an automatic loss (mulligan applies if you still have it).</li>
          <li className="text-[var(--text-primary)]">Everyone’s picks become visible.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">Your commissioner can override lock time for testing or rare schedule quirks — see [For commissioners](#14-for-commissioners-admins).</p>
        <h3 className="font-semibold mt-3 mb-1">Ties &amp; postponements</h3>
        <p className="text-[var(--text-muted)] mb-2">If your picked team’s game ends in a **tie** (after overtime), it counts as a **loss** unless a pool admin overrides. Postponed or **cancelled** games: your commissioner decides how to resolve — ask them, or check the pool notice.</p>
        <h3 className="font-semibold mt-3 mb-1">Season end</h3>
        <p className="text-[var(--text-muted)] mb-2">We prefer a **sole survivor**. If more than one player is still alive at the end of the season, it’s a **shared win**, with an optional season-long tiebreak:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Fewest losses  </li>
          <li>Most weeks survived  </li>
          <li>Nickname A–Z</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="4-seeing-others-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">4. Seeing others’ picks</h2>
        <p className="text-[var(--text-muted)] mb-2">**Before lock:** you only see your own pick (or an empty “still deciding” state). Everyone else shows as hidden — think silhouettes and “reveals after kickoff.”</p>
        <p className="text-[var(--text-muted)] mb-2">**After lock:** all picks for the week are shown.</p>
        <p className="text-[var(--text-muted)] mb-2">**Default view** once you’ve picked (and after lock): the participants list, sorted by:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Status group — **undefeated → one loss → eliminated**  </li>
          <li>Within each group — nickname **A–Z**</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">That way the board reads like a survival ladder, not a random roll call.</p>
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
        <h2 className="text-lg font-semibold text-gold-400 mb-2">8. Notifications <span className="text-sm font-normal text-[var(--text-muted)]">— Wave 2 · Coming soon</span></h2>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming soon in Wave 2:</strong> the notification preference centre, weekly picks digests, SMS late-pick reminders (Twilio), WhatsApp messaging, and close-game alerts. There are no notification toggles for these features in Wave 1.</p>
        <p className="text-[var(--text-muted)] mb-2">A phone number is not currently required; SMS reminders are a Wave 2 feature.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="9-live-scores-digests">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">9. Live scores (Wave 1) &amp; digests (Wave 2 · Coming soon)</h2>
        <p className="text-[var(--text-muted)] mb-2">Live scores update for games tied to pool picks. When a game reaches final, picks auto-grade.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Wave 2 — Coming soon:</strong> the weekly picks digest (email and/or in-app) and close-game alerts. They are not available now; Wave 1 scores and grading remain live.</p>
        <p className="text-[var(--text-muted)] mb-2">If a score or grade looks wrong, pull to refresh; if it’s still off, ping your commissioner.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="10-team-pages">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">10. Team pages <span className="text-sm font-normal text-[var(--text-muted)]">— Wave 2 · Coming soon</span></h2>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming soon in Wave 2:</strong> full team detail and scouting pages, including matchup, player, and clearly labelled demo injury/news details. These pages are not available in Wave 1.</p>
        <p className="text-[var(--text-muted)] mb-2">Any odds shown in the live pick flow are informational only.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="11-install-the-app-pwa">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">11. Install the app (PWA)</h2>
        <p className="text-[var(--text-muted)] mb-2">Survive Sunday is a Progressive Web App. On iOS or Android, use **Add to Home Screen** for a full-screen experience, home-screen icon, and faster launch.</p>
        <p className="text-[var(--text-muted)] mb-2">You’ll get the dark “stadium” theme and an offline shell so the chrome still loads when the network blips. Live scores and pick submits need a connection.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="12-privacy-accounts">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">12. Privacy &amp; accounts</h2>
        <p className="text-[var(--text-muted)] mb-2">Pools are **private and invite-only**. Join with an invite link or code, then sign in with **Google** or **email and password**.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">Your **nickname** is what the pool sees (unique within the pool).</li>
          <li className="text-[var(--text-primary)]">**Real name** is optional — handy when friends already know each other offline.</li>
          <li className="text-[var(--text-primary)]">**Phone number** is not required in Wave 1; SMS reminders are planned for Wave 2.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">To leave a pool or request data deletion, use the account/privacy controls (or contact your commissioner) and see the privacy policy stub linked from settings.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="13-troubleshooting">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">13. Troubleshooting</h2>
        <pre className="card-glass p-3 text-xs overflow-x-auto whitespace-pre-wrap mb-2">| Symptom | Likely fix |
|---------|------------|
| Pick button disabled | Team already used, team on bye, or week already locked. |
| Can’t see mates’ picks | Week hasn’t locked yet — hang tight until first kickoff. |
| Missed SMS | Wave 2 — SMS reminders are coming soon and are not available yet. |
| Scores look wrong | Pull to refresh; if a final grade seems off, report it to your admin. |
| Gloves animation missing | Wave 2 — the H2H boxing-gloves animation is coming soon. |
| Can’t change my pick | Lock has passed — picks are frozen. |</pre>
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
          <li className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> resend digests or late-pick reminders.</li>
          <li className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> enable the WhatsApp group stub and Twilio / Resend configuration.</li>
          <li className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> mark demo-mode team data so “demo” labels stay honest.</li>
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
          <li className="text-[var(--text-primary)]">**Standings** — the board sorts **undefeated → one loss → eliminated**, then nickname A–Z, using the imported history.</li>
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
| **Lock** | Kickoff of the first game of the week; picks freeze and become visible. |
| **Mulligan** | One free pass that auto-absorbs your first loss (or missed pick at lock). |
| **Digest** | **Wave 2 — Coming soon:** post-lock summary of everyone’s picks. |
| **H2H** | **Wave 2 — Coming soon:** head-to-head spotlight when two participants pick opposite sides of a game. |
| **en-CA** | Canadian English locale for copy, dates, and A–Z sorting. |
| **Import (prior picks)** | Commissioner backfill of earlier weeks so mulligan, reuse, and standings stay honest. |
| **Undefeated / one loss / eliminated** | Your survival status for the season. |</pre>
        <p className="text-[var(--text-muted)] mb-2">---</p>
        <p className="text-[var(--text-muted)] mb-2">*Help copy draft — Survive Sunday 2026/27 (en-CA)*</p>
      </section>
      <section id="importing-prior-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Importing prior picks</h2>
        <p className="text-[var(--text-muted)] mb-2">Week 1 of 2026/27 may already be in progress when you start using Survive Sunday. Commissioners can **import picks** the group already made outside the app (spreadsheet, group chat, etc.).</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Open **Commissioner → Import week picks**.</li>
          <li>Upload a CSV or paste rows: `nickname,team` (or `email,team`).</li>
          <li>Example file: `/examples/week1-picks-import.csv`.</li>
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
