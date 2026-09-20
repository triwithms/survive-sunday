export function HelpScreens() {
  return (
    <section id="the-tabs">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">The tabs</h2>
      <p className="text-[var(--text-muted)] mb-2">
        Bottom bar: <strong>My pick</strong> · <strong>Selections</strong> ·{" "}
        <strong>Leaderboard</strong> · <strong>Scores</strong> ·{" "}
        <strong>Schedule</strong> · <strong>Standings</strong>. Header{" "}
        <strong>Share</strong> (square with an arrow, beside <strong>?</strong>)
        shows this page’s link so you can Copy or Send (the installed icon
        has no address bar). Help is <strong>?</strong> — not a tab.
        Share is hidden on Admin and Settings.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
        <li className="text-[var(--text-primary)]">
          <strong>My pick</strong> — your card. After Sign in you land here.
          Tap Game details in the middle of a matchup for that week&apos;s
          game sheet; Close keeps you on My pick. Pick stays the main action.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Selections</strong> — everyone’s picks this week. Hidden
          until first kickoff. Same team together, then nickname A–Z. Not the
          season race.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Leaderboard</strong> — season race: still in, then out;
          then fewest losses / most weeks survived. Among equals, clean
          record (no 💩), then win margin, then nickname. No week chip.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Scores</strong> — live and final games for{" "}
          <strong>your current pick week</strong>. Tap Details for clips.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Schedule</strong> — browse any week. Tap Details for the
          same game sheet as Scores.{" "}
          <strong>Future weeks stay on</strong> Schedule.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Standings</strong> — NFL win-loss. Not the pool Leaderboard.
          Tap a team to research.
        </li>
      </ul>
      <p className="text-[var(--text-muted)] mb-2">
        My pick, Selections, Scores, and Schedule open on your current pick
        week.
      </p>
      <div id="share-board-scores">
        <h3 className="text-lg font-semibold text-gold-400 mb-2">
          Share Leaderboard &amp; Scores as a picture
        </h3>
        <p className="text-[var(--text-muted)]">
          Header Share sends a link, not a picture. It shows the full URL
          so you can <strong>Copy</strong> (the installed icon has no
          address bar). On Leaderboard,{" "}
          <strong>press and hold the page title</strong> (no week chip). On
          Scores, press and hold the title, or{" "}
          <strong>tap the week label three times</strong> (gold{" "}
          <strong>Week N</strong>). Pick a{" "}
          <strong>full long picture</strong> or a shorter option → Make picture
          → Save or Send.
        </p>
      </div>
    </section>
  );
}
