export function HelpPick() {
  return (
    <section id="making-a-pick">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">
        Making / changing a pick
      </h2>
      <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
        <li className="text-[var(--text-primary)]">
          <strong>My pick</strong> is your card. Pick one team to win this week.
          If you&apos;re out for the season, this screen is covered with a
          huge <strong>YOU&apos;RE OUT</strong> notice — you can&apos;t submit
          or change a pick. Leaderboard and Scores still work from the bar
          below.
        </li>
        <li className="text-[var(--text-primary)]">
          You can’t reuse a team you’ve already picked. Bye-week teams are off
          the board.
        </li>
        <li className="text-[var(--text-primary)]">
          Change until <strong>your</strong> kickoff — and only onto a game that
          has not started. There is no slate-wide deadline countdown.
        </li>
        <li className="text-[var(--text-primary)]">
          When your game starts, that pick locks and next week opens for you.
          You don’t wait for Monday Night Football.
        </li>
        <li className="text-[var(--text-primary)]">
          Miss the first kickoff with no pick? That counts as a loss (mulligan
          if you still have one).
        </li>
      </ul>
    </section>
  );
}
