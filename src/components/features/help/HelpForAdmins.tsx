export function HelpForAdmins() {
  return (
    <section id="for-administrators">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">
        For Administrators
      </h2>
      <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
        <li className="text-[var(--text-primary)]">
          Admin is in the header. Players · This Week · Pool.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Add user</strong> on Players: fill name, nickname, cell, email,
          and a password you can text — or send a Join invite. Email and cell
          must be unique. Welcome asks for anything still missing. We do not
          email the password.
        </li>
        <li className="text-[var(--text-primary)]">
          Tap a friend to edit nickname, full name, email, or cell, then{" "}
          <strong>Save this person</strong>. Same uniqueness. Set a password
          you can text. They Sign in — no people list.
        </li>
        <li className="text-[var(--text-primary)]">
          Notifications on Players use the same master On/Off and per-type
          Email / SMS / both / Off as Account. This Week has{" "}
          <strong>Send test to me</strong> (it arrives marked ADMIN TEST, not a
          real pool alert). This Week → <strong>Week wrap</strong>{" "}
          picks Funny, Straight facts, or Short, then previews,{" "}
          <strong>Send now</strong>, or <strong>Skip this week</strong>. The
          automatic note goes out at noon (Toronto) the day after the last
          game is final. The opening line is automatic from the week’s
          results (who is still in, who took a hit, who went out); Funny uses
          the same line for now, and the email override box swaps in your own
          intro. The email shows Won, Lost, and Eliminated (only if someone
          went out) with team helmets, friends on the same team listed
          together, then the pool leaderboard and
          NFL division standings, plus the NFL Every Touchdown video when
          that post exists, and a small preferences link. Texts stay short.{" "}
          <strong>Missing picks</strong> lists who is still blank.{" "}
          <strong>Remind all</strong> confirms email, SMS, and who is skipped
          before it sends. Copy text stays. The daily reminder is only the
          last 24 hours before lock. Week wrap sits above those tools.
        </li>
        <li className="text-[var(--text-primary)]">
          Personal Join links: <strong>Copy join link</strong> on each Players
          row. Do not paste one link in the group chat. Filters: All, No pick,
          One loss, Out. Pool → <strong>Reset pool</strong> is last and needs
          RESET typed.
        </li>
        <li className="text-[var(--text-primary)]">
          This Week → <strong>Enter a friend’s pick</strong> for this week or a
          past week. Next week opens for them after their own game starts.
          Changes are audit-logged.
        </li>
        <li className="text-[var(--text-primary)]">
          Turn the mulligan off from a chosen week (one-and-done).
          Already-scored weeks stay.
        </li>
        <li className="text-[var(--text-primary)]">
          On a player’s record, <strong>Make administrator</strong> adds Admin
          tools. Pool lists administrators. <strong>Hand the pool</strong>{" "}
          gives Admin to someone else and you stay as a player.
        </li>
      </ul>
    </section>
  );
}
