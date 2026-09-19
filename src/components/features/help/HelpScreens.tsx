export function HelpScreens() {
  return (
    <>
      <section id="4-seeing-others-picks">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">4. Seeing others’ picks</h2>
        <p className="text-[var(--text-muted)] mb-2">**Before lock:** you only see your own pick (or an empty “still deciding” state). Everyone else shows as hidden — think silhouettes and “reveals after kickoff.” The Board, Home, and Scores still list people **undefeated first**, then **one-loss** (still alive with a mulligan), then **eliminated**. Within each of those groups: **same pick** (team abbreviation; no pick last), then **same game** (earlier kickoff first), then nickname **A–Z**.</p>
        <p className="text-[var(--text-muted)] mb-2">**After lock:** all picks for the week are revealed. Home shows **Picks by game**; Scores lists **Participants’ picks**. Board and Scores use the **same order**:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2">
          <li>**Undefeated**, then **one-loss**, then **eliminated** (more losses further down)  </li>
          <li>**Same pick** together (team abbreviation; no pick last in that group)  </li>
          <li>**Same game** together (earlier kickoff first)  </li>
          <li>Nickname **A–Z**  </li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">Home’s **Picks by game** still groups the page by kickoff, then away-side pickers and home-side pickers. Inside each of those pick clusters (and Missed / no pick), the same undefeated → one-loss → eliminated → A–Z order applies.</p>
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
        <p className="text-[var(--text-muted)] mb-2">When released, keep it friendly; administrators may remove abusive messages.</p>
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
        <p className="text-[var(--text-muted)] mb-2"><strong>Home</strong>, <strong>Scores</strong>, and <strong>Schedule</strong> open on <strong>your current pick week</strong> (the same week Pick is focused on). You can look back at past weeks. Future weeks stay on <strong>Schedule</strong> — Home and Scores will not open them, but Schedule still lets you browse every week. Live games keep team names and scores, with a TV-style strip: <strong>down &amp; distance</strong> (for example <strong>1ST &amp; 10</strong>) and <strong>quarter and clock</strong> (for example <strong>4TH | 9:00</strong>) from ESPN. A <strong>🏈</strong> beside the abbreviation (and a gold bar) marks who has the ball; the yard line (for example <strong>MIN 42</strong>) shows when ESPN has it. If the clock is missing, ESPN’s short status is used (for example <strong>END 2ND</strong> / <strong>HALF</strong>). Finals show <strong>Final</strong>. Upcoming games show today’s kickoff time (ET). ESPN team logos sit beside the abbreviations on <strong>Scores</strong>, <strong>Pick</strong>, the <strong>Board</strong>, and <strong>League</strong> (and on each friend’s pick under Scores). <strong>Tap Details</strong> on a game (right side of the card) for timeouts, scoring plays, drives, leaders when ESPN has them, and a YouTube <strong>preview</strong> (before kickoff) or <strong>highlights</strong> (live / Final) as a thumbnail you open on YouTube. Team logos still open that team’s research page.</p>
        <p className="text-[var(--text-muted)] mb-2"><strong>Coming later:</strong> weekly picks digests and close-game alerts.</p>
        <p className="text-[var(--text-muted)] mb-2">If a score or grade looks wrong, pull to refresh; if it’s still off, ping your administrator.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
      <section id="videos">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">Videos</h2>
        <p className="text-[var(--text-muted)] mb-2">Header <strong>Videos</strong> (next to Schedule) lists this week’s official YouTube clips in short / medium / longer groups. Home also shows a few title cards. Clips are <strong>this 2026/27 season only</strong> (older years and archive / throwback videos are skipped). <strong>Previews</strong> are only for games that have not kicked off yet (for example Monday Night Football still to play). After a game is on or Final, that game’s previews come down and <strong>highlights</strong> show instead. Every clip is a <strong>thumbnail + title</strong> — tap <strong>Watch on YouTube</strong> to open it in the YouTube app or your browser. We never play videos inside the app (NFL blocks that and it showed an error). After watching, switch back to Survive Sunday; we don’t jump you back automatically.</p>
        <p className="text-[var(--text-muted)] mb-2">On <strong>Scores</strong>, open a game’s <strong>Details</strong> for that matchup’s preview (before kickoff) or highlights (live / Final). Videos are extra research — a missing clip never blocks picks, scores, or grading.</p>
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
    </>
  );
}
