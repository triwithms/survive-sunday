export function HelpForAdmins() {
  return (
    <section id="for-administrators">
      <h2 className="text-lg font-semibold text-gold-400 mb-2">
        For Administrators
      </h2>
      <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
        <li className="text-[var(--text-primary)]">
          Admin is in the header. Users · Pool · System.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Add user</strong> on Users: fill name, nickname, cell, email,
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
          Notifications on Users use the same master On/Off and per-type
          Email / SMS / both / Off as Account. System has{" "}
          <strong>Send test to me</strong> (it arrives marked ADMIN TEST, not a
          real pool alert). System → <strong>Week wrap</strong>{" "}
          picks Funny, Straight facts, or Short, then previews,{" "}
          <strong>Send now</strong>, or <strong>Skip this week</strong>. The
          automatic note goes out at noon (Toronto) the day after the last
          game is final. The email shows Won, Lost, and Eliminated (only if
          someone went out) with team helmets, then the pool leaderboard and
          NFL division standings, plus the NFL Every Touchdown video when
          that post exists, and a small preferences link. Texts stay short.{" "}
          <strong>Missing picks</strong> lists who is still blank, sends
          reminders, or copies a group-chat list while the week is open. The
          daily reminder is only the last 24 hours before lock.
        </li>
        <li className="text-[var(--text-primary)]">
          Personal Join links: one Copy per friend on their Users row. Do not
          paste one link in the group chat.
        </li>
        <li className="text-[var(--text-primary)]">
          System → <strong>Enter a friend’s pick</strong> for this week or a
          past week. Next week opens for them after their own game starts.
          Changes are audit-logged.
        </li>
        <li className="text-[var(--text-primary)]">
          Turn the mulligan off from a chosen week (one-and-done).
          Already-scored weeks stay.
        </li>
        <li className="text-[var(--text-primary)]">
          <strong>Make administrator</strong> adds Admin tools.{" "}
          <strong>Hand the pool</strong> gives Admin to someone else and you
          stay as a player.
        </li>
      </ul>
    </section>
  );
}
