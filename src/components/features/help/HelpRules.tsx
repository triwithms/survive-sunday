export function HelpRules() {
  return (
    <>
      <section id="1-welcome-to-survive-sunday">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">1. Welcome to Survive Sunday</h2>
        <p className="text-[var(--text-muted)] mb-2">Survive Sunday is a private, invite-only NFL survivor (elimination) pool for friends. Each week, every active player picks one team to win. Pick right and you keep going. Pick wrong and you burn your mulligan — or you’re out.</p>
        <p className="text-[var(--text-muted)] mb-2">This pool covers the **2026/27 NFL regular season** (weeks 1–18). Playoffs may come later; for now we’re all about surviving the grind.</p>
        <p className="text-[var(--text-muted)] mb-2">**For entertainment among friends. Not a gambling service.** Spreads and moneylines you see in the app are informational only — you can’t place wagers here. If ESPN does not have a line yet, we hide it (or show —) rather than invent a number.</p>
        <p className="text-[var(--text-muted)] mb-2">The app is written in **Canadian English** (`en-CA`): favourite, cancelled, colour, centre, and friendly date formats.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="2-how-to-play-quick-start">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">2. How to play (quick start)</h2>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Open your <strong>personal Join link</strong>. Your name should already be picked. Set your own email and password — once. Stay signed in on this phone. If the seat is already claimed, Sign in instead. New joiners not on the list can create a unique nickname.</li>
          <li>Open **Pick** and choose from **This week’s games** — pick **exactly one** NFL team to win. Use the arrows beside the **W#** badge in the header to flip to other weeks.</li>
          <li>Submit before the **Pick deadline** (header countdown) — the week locks at the kickoff of the first game that week (usually Thursday Night Football). You can still change your pick until **that team’s** kickoff, as long as the new game has not started either. **When that game starts, next week opens for you immediately** (no waiting for Monday Night Football). If you join after that week has already locked and you never had a pick path, the next week is the obvious next action. After your own game starts, that week’s pick stays read-only.</li>
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
            { src: '/help-preview/01-login.png', alt: 'Sign in screen', caption: 'Sign in (email and password)' },
            { src: '/help-preview/02-pool-home.png', alt: 'Selections — group picks', caption: 'Selections — group picks' },
            { src: '/help-preview/03-pick-this-weeks-games.png', alt: 'My pick — This week’s games', caption: 'My pick — This week’s games' },
            { src: '/help-preview/04-team-research.png', alt: 'Team research', caption: 'Team research' },
            { src: '/help-preview/05-team-news.png', alt: 'Team news', caption: 'Team news' },
            { src: '/help-preview/06-league-standings.png', alt: 'Standings — NFL W-L with 2025 rank', caption: 'Standings — NFL W-L (with 2025 rank)' },
            { src: '/help-preview/07-board-survival.png', alt: 'Leaderboard — pool in/out race', caption: 'Leaderboard — pool in/out race' },
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
        <h3 className="font-semibold mt-3 mb-1">One mulligan (unless the administrator turns it off)</h3>
        <p className="text-[var(--text-muted)] mb-2">Everyone starts with **one** mulligan for the season. You don’t choose when to burn it — it **auto-burns** on your first wrong pick **or** on a missed pick at lock.</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">After that first loss: status becomes **one loss** — you’re still in.</li>
          <li className="text-[var(--text-primary)]">A second loss: you’re **eliminated**.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">There’s no manual “save my mulligan for later” switch.</p>
        <p className="text-[var(--text-muted)] mb-2">The administrator can **turn off the free mulligan** from a chosen week (or immediately). From that week on, the pool is **one-and-done**: one loss or a missed pick puts you out. A gold banner says **From Week X: no mulligan / one-and-done.** Already-scored weeks stay as they were — nobody is retroactively eliminated. If you already used your mulligan (**One loss**), you stay in; your next loss still puts you out.</p>
        <h3 className="font-semibold mt-3 mb-1">Lock time</h3>
        <p className="text-[var(--text-muted)] mb-2">The week locks at the **kickoff of the first scheduled game** that week. After lock:</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]">You may change an existing pick to another team whose game has **not started yet**, as long as **your current pick’s game has also not started**. Once that kickoff starts (or the game is live/final), the pick locks **and the next week’s picks open for you** — you do not wait until Monday Night Football. A missed first pick at lock still counts as a miss — this is not a late first-pick window.</li>
          <li className="text-[var(--text-primary)]">**New joiners after a deadline:** if you never had a pick path for the locked week, Pick goes to the **next** week (for example **Week 2 is open — make your pick**). The header will not strand you on “Deadline passed.”</li>
          <li className="text-[var(--text-primary)]">Late pickers who never selected take an automatic loss (mulligan applies if you still have it).</li>
          <li className="text-[var(--text-primary)]">Everyone’s picks become visible.</li>
        </ul>
        <p className="text-[var(--text-muted)] mb-2">Your administrator can override lock time for testing or rare schedule quirks — see [For administrators](#14-for-administrators).</p>
        <h3 className="font-semibold mt-3 mb-1">Ties &amp; postponements</h3>
        <p className="text-[var(--text-muted)] mb-2">If your picked team’s game ends in a **tie** (after overtime), it counts as a **loss** unless a pool admin overrides. Postponed or **cancelled** games: your administrator decides how to resolve — ask them, or check the pool notice.</p>
        <h3 className="font-semibold mt-3 mb-1">Season end</h3>
        <p className="text-[var(--text-muted)] mb-2">We prefer a **sole survivor**. The official winner must have a **clean** season: **no 💩 stamps**. Ranked auto-pick (~2 minutes before lock) is for staying in for fun when you are busy — it keeps you on the board but you cannot win the pool. Copy-from-member, your own picks, and administrator import / fix-pick do **not** stamp. If more than one **eligible** player is still alive after Week 18, apply this ladder:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>**Clean record** (no ranked auto-pick 💩).</li>
          <li>**Fewest losses** (undefeated beats one loss).</li>
          <li>**Most weeks survived**.</li>
          <li>Still tied → **shared win** (co-champions). Nickname A–Z is only for list order — it does not crown a sole winner.</li>
          <li>**Optional backup:** the administrator may run **one extra pick week** among only the tied eligible players if the group wants a sole champ.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
    </>
  );
}
