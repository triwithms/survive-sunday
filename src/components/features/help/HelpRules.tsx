import { HelpMulligan } from "./HelpMulligan";

export function HelpRules() {
  return (
    <section id="rules">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">Rules</h2>
      <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
        <li className="text-[var(--text-primary)]">
          Private NFL survivor pool. Pick one winner each week. Last friends
          standing win the bragging rights.
        </li>
        <li className="text-[var(--text-primary)]">
          No team reuse. Bye-week teams are off the board.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Mulligan:</strong> one, unless the administrator turns it off.
          First loss or missed pick at lock burns it — you’re still in with one
          loss. A second loss eliminates you. One-and-done shows as{" "}
          <strong>From Week X: no mulligan / one-and-done.</strong>
        </li>
        <li className="text-[var(--text-primary)]">
          First kickoff reveals everyone’s picks on Selections. You can still
          change until your own kickoff.
        </li>
        <li className="text-[var(--text-primary)]">
          A tie counts as a loss unless an administrator says otherwise.
        </li>
        <li className="text-[var(--text-primary)]">
          Badges: <strong>Undefeated</strong>, <strong>One loss</strong>,{" "}
          <strong>Eliminated</strong>.
        </li>
      </ul>
      <HelpMulligan />
    </section>
  );
}
