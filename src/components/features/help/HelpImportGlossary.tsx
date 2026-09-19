export function HelpImportGlossary() {
  return (
    <>
      <section id="15-importing-prior-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">15. Importing prior picks</h2>
        <p className="text-[var(--text-muted)] mb-2">Week 1 (or more) may already be underway when your pool jumps into Survive Sunday. Administrators can **import prior picks** so history matches reality — without asking everyone to re-enter locked weeks by hand.</p>
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
          <li className="text-[var(--text-primary)]">**Leaderboard** — the season race sorts **still in**, then **out**, then fewest losses / most weeks survived, then clean record / win margin / nickname, using the imported history.</li>
        </ul>
        <h3 className="font-semibold mt-3 mb-1">How administrators do it
1. Open the admin **Import prior picks** flow (CSV upload or on-screen form).
2. Map each row to a nickname, week, and team (use official abbreviations).
3. Review the preview — especially mulligan burns and anyone who would already be eliminated.
4. Confirm. The import is **audit-logged** so the pool can see that history was backfilled (not a silent edit).</h3>
        <h3 className="font-semibold mt-3 mb-1">For players
You don’t need to re-pick locked weeks. After import, check your status badge and used-teams list. If something looks off, ping your administrator — they’ll correct it with another audited change, not a quiet rewrite.</h3>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="16-glossary">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">16. Glossary</h2>
        <pre className="card-glass p-3 text-xs overflow-x-auto whitespace-pre-wrap mb-2">| Term | Meaning |
|------|---------|
| **Pick deadline** | You can change until **your game starts**. First kickoff is when everyone’s picks reveal on Selections — not a personal lock. **Your next week opens when your own pick is locked** (your game started), not after Monday Night Football. |
| **Lock** | Same moment as the pick deadline for the group board. You can still change an existing pick until that team’s kickoff. When that game starts, next week’s picks open for you. |
| **This week’s games** | The list of matchups you pick from on the Pick screen (not “slate”). |
| **Leaderboard** | Pool in/out race (`/standings`): still in, then out; then fewest losses / most weeks survived; among equals, clean record, win margin of finished picks, nickname A–Z. No week chip. Weekly picks are on **Selections**. |
| **Selections** | Everyone’s picks for the week (`/pool`). Same team together, then nickname A–Z. Not the in/out race. |
| **Standings** | NFL W-L (`/nfl`). Not the pool Leaderboard. |
| **Share (picture)** | Leaderboard: press and hold the title. Scores: press and hold the title, or triple-tap the week label. No Share button. Full long picture is always offered. |
| **2025 rank** | Last season’s composite power rank (1 = strongest). Research only. |
| **Mulligan** | One free pass that auto-absorbs your first loss (or missed pick at lock), unless the administrator turns it off. |
| **One-and-done** | Administrator rule: from a chosen week, one loss (or missed pick) puts you out. Banner: “From Week X: no mulligan / one-and-done.” |
| **Hand the pool** | Current admin gives Admin to another pool member and stays as a player. Different from Make administrator (that keeps both people as Admin). |
| **Notification preferences** | Account → Notification preferences. Per alert: SMS / Email / both / none (coming soon until send works). |
| **Auto-pick 💩** | Stamp only when the ~2-minute ranked leftover writes a pick. Shown beside the nickname on Leaderboard / Selections. Clean record required to win. |
| **Digest** | **Coming later:** post-lock summary of everyone’s picks. |
| **H2H** | **Coming later:** head-to-head spotlight when two participants pick opposite sides. |
| **en-CA** | Canadian English locale for copy, dates, and A–Z sorting. |
| **Import (prior picks)** | Administrator backfill of earlier weeks so mulligan, reuse, and standings stay honest. |
| **Personal Join link** | A per-person URL from Admin that opens Join with that seat already picked. If the seat is claimed, it points to Sign in. |
| **Forgot password** | Sign in → Forgot password? → 6-digit email code (text if a cell is saved). Check spam/junk. Not a code at every login. Join first. |
| **Undefeated / one loss / eliminated** | Your survival status for the season. |</pre>
        <p className="text-[var(--text-muted)] mb-2">---</p>
        <p className="text-[var(--text-muted)] mb-2">*Help updated with the current app — Survive Sunday 2026/27 (en-CA)*</p>
      </section>
      <section id="importing-prior-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Importing prior picks</h2>
        <p className="text-[var(--text-muted)] mb-2">Week 1 of 2026/27 may already be in progress when you start using Survive Sunday. Administrators can **import picks** the group already made outside the app (spreadsheet, group chat, etc.).</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>Open **Admin → Import week picks**.</li>
          <li>Upload a CSV or paste rows: `nickname,team` (or `email,team`).</li>
          <li>Use the official Week 1 list in the owner handoff — not `/examples/week1-picks-import.csv` (leftover demo sample).</li>
          <li>Imported picks are marked **imported**, written to the **audit log**, and follow normal rules: visible after lock, graded when games are final, mulligan / elimination applied, team reuse enforced. Import / fix-pick does **not** add a 💩 — only the ranked auto-pick path does.</li>
          <li>If you need to force a mid-season import that reuses a team, tick the override — that is also audited.</li>
        </ol>
      </section>
    </>
  );
}
