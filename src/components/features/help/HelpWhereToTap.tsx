export function HelpWhereToTap() {
  return (
    <section id="where-to-tap">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">Where to tap</h2>
      <p className="text-[var(--text-muted)] mb-2">
        Bottom bar, in this order: <strong>My pick</strong> ·{" "}
        <strong>Selections</strong> · <strong>Leaderboard</strong> ·{" "}
        <strong>Scores</strong> · <strong>Schedule</strong> ·{" "}
        <strong>Standings</strong>. Administrators also see <strong>Admin</strong>.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
        <li className="text-[var(--text-primary)]">
          <strong>My pick</strong> (<code>/pick</code>) — your card. Change or make
          a pick until your own kickoff. This is where you land after Sign in.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Selections</strong> (<code>/pool</code>) — everyone’s picks for
          the week. Not the in/out race.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Leaderboard</strong> (<code>/standings</code>) — who is still in
          vs out (weeks survived / eliminated order).
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Scores</strong> and <strong>Schedule</strong> — same jobs as
          before. Clips stay inside a game’s <strong>Details</strong>.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Standings</strong> (<code>/nfl</code>) — NFL win-loss. Not the
          pool Leaderboard.
        </li>
      </ul>
      <p className="text-[var(--text-muted)] mb-2">
        Header corner: <strong>Account</strong> and a <strong>?</strong> for Help.
        There is no Home, Pool, Board, League, Videos, or Help tab in the bottom
        bar.
      </p>
      <p className="text-[var(--text-muted)] mb-2">---</p>
    </section>
  );
}
