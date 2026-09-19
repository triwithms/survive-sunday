export function HelpForAdmins({ showDemoCopy = false }: { showDemoCopy?: boolean }) {
  return (
    <>
      <section id="14-for-administrators">
        <h2 className="text-lg font-semibold text-gold-400 mb-2">14. For administrators</h2>
        <p className="text-[var(--text-muted)] mb-2">You’re the light touch that keeps the pool fair:</p>
        <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)] mb-2">
          <li className="text-[var(--text-primary)]"><strong>Share the Leaderboard or Scores (quiet):</strong> no Share button on the screen. Press and hold the page title, or tap the week label (gold <strong>W#</strong>) three times → pick full long picture or a shorter option → Make picture → Save or Send. Click-by-click in <a href="#share-board-scores" className="text-gold-400">Share Leaderboard &amp; Scores</a>.</li>
          <li className="text-[var(--text-primary)]"><strong>Add user:</strong> Admin → Users → fill whatever you know (name, nickname, cell, email, password) or send a Join invite + a password you can text. Welcome asks for anything still missing. We do not email the password.</li>
          <li className="text-[var(--text-primary)]"><strong>Personal Join links:</strong> Admin → Copy next to that friend → send that one person their link. Do <strong>not</strong> blast one link to the group chat. Click-by-click in <a href="#getting-started-join-signin-home-screen" className="text-gold-400">Getting started</a>.</li>
          <li className="text-[var(--text-primary)]">**Enter a friend’s pick** on System for this week or a past week. Next week opens for them after their own game starts.</li>
          <li className="text-[var(--text-primary)]">**Remove players** who shouldn’t be in the pool (inside that person’s Users editor).</li>
          <li className="text-[var(--text-primary)]">**Roster:** open **Admin → Users** to see every nickname and real name, and fix nickname, full name, email, or cell if it’s wrong. Each change is audit-logged. Notification prefs use the same SMS / Email / both / none dropdowns as Account (coming soon until send works).</li>
          <li className="text-[var(--text-primary)]">**Roles:** one login can be a **Player** and an **Administrator**. If you have both, switch in **Account** (top right) with **Playing as …** / **Admin tools** — that switch is not on Standings or other main screens. Players without Admin never see Admin tools. You can **Make administrator** for someone already in the pool (they stay on the Leaderboard). The pool always keeps at least one administrator. A later **Watcher** role (follow the Leaderboard, no picks) is reserved and not in the app yet.</li>
          <li className="text-[var(--text-primary)]">**Turn off the free mulligan** (one-and-done from a chosen week). Already-graded weeks are not re-scored. People who already used a mulligan stay in with one loss.</li>
          <li className="text-[var(--text-primary)]">**Hand the pool to someone else** — transfer Admin to another member who is already in the pool. You stay as a player and lose Admin. They keep their picks and stay on the board. This is different from **Make administrator**, which lets more than one person have Admin tools.</li>
          <li className="text-[var(--text-primary)]"><strong>Coming later:</strong> weekly digests. Late-pick reminders already respect Notification preferences.</li>
          <li className="text-[var(--text-primary)]"><strong>Set a temporary password:</strong> Admin → Users → find that friend → tap Edit → set a password → copy the text and send it. Audit-logged. Does <strong>not</strong> email the password. If they have not Joined, send their personal Join link instead.</li>
          {showDemoCopy && (
            <li className="text-[var(--text-primary)]"><strong>Wave 2 — Coming soon:</strong> mark demo-mode team data so “demo” labels stay honest.</li>
          )}
        </ul>
        <h3 className="font-semibold mt-3 mb-1">Turn off the mulligan (one-and-done)</h3>
        <p className="text-[var(--text-muted)] mb-2">Open **Admin → Pool rules — mulligan**. Tick the box, choose the starting week (this week or later — or an earlier week if you only want the label; old games are not re-scored), and save. Confirm the prompt.</p>
        <p className="text-[var(--text-muted)] mb-2">You can turn the free mulligan back on the same way. That does not revive anyone already eliminated.</p>
        <h3 className="font-semibold mt-3 mb-1">Hand the pool to someone else</h3>
        <p className="text-[var(--text-muted)] mb-2">Open **Admin → Hand the pool to someone else**. Pick a person who is already a member, type their nickname, tick the confirmation box, and confirm. You stay in the pool as a player and lose Admin. They keep their picks and get the Admin screen. This is different from **Make administrator**, which lets both of you keep Admin tools. If nobody else is in the pool yet, the app will not let you transfer — that would lock everyone out.</p>
        <h3 className="font-semibold mt-3 mb-1">Set a temporary password (stuck friend)</h3>
        <p className="text-[var(--text-muted)] mb-2">When a friend already Joined but cannot get a reset code (codes need Resend keys), open **Admin → Users**.</p>
        <ol className="list-decimal pl-5 space-y-1 mb-2 text-[var(--text-muted)]">
          <li className="text-[var(--text-primary)]">Find their name (example: <strong>Cannoli Stuffer</strong> / Mike Frigo) and tap <strong>Edit</strong>.</li>
          <li className="text-[var(--text-primary)]">Tap <strong>Suggest a password I can text</strong>, or type one (at least 6 characters).</li>
          <li className="text-[var(--text-primary)]">Save. Copy the text. <strong>Send it yourself</strong> — the app does not email it.</li>
          <li className="text-[var(--text-primary)]">They open Sign in → that email and password.</li>
        </ol>
        <p className="text-[var(--text-muted)] mb-2">If the name is greyed out or missing, they have <strong>not Joined</strong> yet. Copy their personal Join link instead of a password. This change is audit-logged (nickname only — never the password).</p>
        <p className="text-[var(--text-muted)] mb-2">**Important:** you cannot silently edit another player’s pick. Any such change must leave an **audit log** entry visible to the pool.</p>
        <p className="text-[var(--text-muted)] mb-2">Remind the group: this is entertainment among friends — no in-app betting.</p>
        <p className="text-[var(--text-muted)] mb-2">---</p>
      </section>
    </>
  );
}
