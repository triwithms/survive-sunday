# Live pool and Week 1 import

Plain-English playbook for the administrator. You do **not** need to code. Phone-friendly.

Invite code for friends: **`SUNDAY26`**.

---

## Demo vs Real toggle was removed

The pool is **live-only**. There is no mode switch on Admin. Week 1 is the current board week. Week 2 is a real upcoming NFL week — friends can view the schedule. **A player’s Week 2 picks open as soon as their own Week 1 game has started** (or if they never had a Week 1 pick path). Do not wait for Monday Night Football.

Home is **Who are you?** from the live roster, then Join or Sign in. Unclaimed seats still use `@survivesunday.demo` emails so Join can claim that nickname — that is seat claiming, not Demo mode.

---

## Administrator login is READY

There is no **Your administrator login** panel on Admin. Gams is Player + Administrator. Sign in with that real email, then switch **Admin tools** from **Account**.

Friends never see a practice administrator password.

---

## What friends see

**Who are you?** from the live roster, then **Join** (own email + password) or **Sign in**. No practice passwords. Practice emails (`…@survivesunday.demo`) cannot sign in as players once a real administrator exists. `demo1234` is not shown. Those practice emails **are** claimable on Join until the real person takes the seat.

### Who are you? (claim your existing seat)

The list is the **live Admin roster** (current nicknames + real names), not a hard-coded file. Administrator / non-player seats are left off.

1. Home or **Join the pool** → pick e.g. `Gams (Robert Gama)`.
2. Enter invite code **`SUNDAY26`**, **your own email**, and a password you choose.
3. That login attaches to the existing membership. Week 1 picks stay with that person — you do not get a second “Gams”.
4. If that seat already has a real (non-practice) email: **already claimed — Sign in instead** (or ask the administrator).
5. Practice `@survivesunday.demo` seats (and leftover `@pending.survivesunday.local` placeholders) **are** claimable by the real person.
6. **One user, more than one role.** There is no separate “admin account.” If you already sign in with `robertgama@gmail.com` (Administrator), pick **Gams** on Join and use that same email and the password you already sign in with. That adds the **Player** role to the same user. Or **Sign in first**, then Join — email is prefilled, and you still type the password. Then switch **Playing as Gams** | **Admin tools**. Do not invent a second email. If Join says the email already has an account, tap **I already have this login — Sign in to claim**.
7. When you have both roles, switch in **Account** (top right): **Playing as Gams** | **Admin tools**. That switch is not on League or other main screens. Player view hides Admin. Admin view shows Admin. Friends who are only players never see Admin tools.
8. On **Admin**, you can **Make administrator** for someone already in the pool (confirm first). They stay on the board. You can remove Admin later if at least one administrator remains. Roles live on a user↔roles list so a later **Watcher** (follow the board, no picks) can be added without starting over. Watcher is **not** in the app yet.
9. Nicknames still change on **Admin → Roster** or **Change nickname**. The list always shows the current names.

---

## After you wipe practice seats (reset)

Home page = **Who are you?** (live roster) + **Join** + **Sign in**.

- `admin@survivesunday.demo` / `demo1234` will **not** work if you already saved a real administrator login (reset removes the practice administrator).
- Sign in with the real email you saved.
- Friends pick themselves from the live roster, then join with invite code **`SUNDAY26`** and their own email + password. That attaches to the existing nickname seat (Week 1 picks stay). If the seat already has a real email, they Sign in instead.

---

## Reset pool (optional)

Real mode already uses Week 1. Use reset when you want a **clean** board before importing real Week 1 picks. You do **not** have to reset today.

1. Admin → **Pool → Reset pool** (the red card, last).
2. Read the preview.
3. Tap **Start reset…**
4. Type **`RESET`**.
5. Tap **Yes, reset the pool**.

### What reset does

- Clears all picks.
- Sets everyone who stays to **undefeated** with a fresh mulligan.
- Removes practice accounts (`…@survivesunday.demo`), including the old practice administrator if you already saved a real login.
- Sets the pool to **Week 1**.
- Keeps the schedule, games, your administrator login, and real friends who joined with their own email.

### What reset does **not** do

- It does **not** delete the website or password settings.
- It does **not** remove your administrator account.
- It does **not** remove friends who joined with a real email.

This cannot be undone. Skipping reset keeps the live Week 1 board. There is no Demo-mode switch to hide the picker — Home is already Who are you? + Join.

---

## Real names on the live site

Long Snapper → **John Stilo**, Steve → **Steve Venerus**, Gdogss → **Tony Gyuro**.

Live roster also includes **Go Giants** (Carson Gama), **Pauli** (Paul Gama), and **JaJa** (Jacquie Gama). Pauli’s nickname is **Pauli**. JaJa’s Join seat is claimable (`jaja@survivesunday.demo`) and her Week 1 pick is **DAL** (Dallas — not Gams’ KC). She is set to copy Gams’ pick if she still has none within 30 minutes of kickoff / lock (later weeks; copy does not stamp 💩). Any player can instead auto-pick the best remaining **2025 rank** team (~2 minutes before lock) from Account or Admin → Roster — that stamps 💩 and they cannot be the official winner.

This is applied to the **live database** on deploy (and again when the site loads). Changing seed files alone is not enough.

To fix any other name: **Admin → Roster — nicknames and real names**.

---

## Week 1 picks (already imported)

Official Week 1 picks (including Go Giants, Pauli, and JaJa → DAL) are **already on the live board**. You do not need to import again tonight.

If one name looks wrong later:

1. Admin → **Import week picks (CSV / paste)**
2. Week number: **1**
3. Paste `nickname,team` rows (official list: [`docs/HANDOFF.md`](./HANDOFF.md) section **6b**)
4. Tap **Preview matches** and check every name.
5. Confirm.

Do **not** use `/examples/week1-picks-import.csv` — that file is leftover demo sample data.

---

## Suggested order for the real season

Most of this is **already done** (evening 13 Sep 2026): the pool is live, Week 1 picks are imported, Who are you? is live, Gams / Go Giants / Pauli seats are claimed.

1. Friends land on **Week 1**. Week 2 stays on the schedule. There is no Demo vs Real toggle.
2. You already have a **real administrator login**. Sign in with that email. Same email can hold **Player + Administrator** — use **Playing as Gams** / **Admin tools**.
3. Fix names on **Roster** only if needed (John Stilo / Steve Venerus / Pauli / Go Giants / JaJa should already be right). JaJa’s pick backup (copy from Gams) is on that same Roster card, or **Account → Pick backup**.
4. **Do not Reset pool** unless you intend to wipe the imported Week 1 board.
5. Add **Resend** keys on Vercel (`RESEND_API_KEY` + `RESEND_FROM_EMAIL`) and Redeploy — then test **Forgot password** once. That is the invite blocker. If a claimed friend is stuck tonight (Cannoli Stuffer / Mike Frigo), use **Admin → Set a temporary password** or the one-shot temp password from the password-reset fix, and text them.
6. Then send friends to **Join the pool** with invite code **`SUNDAY26`**. They pick their name from the live roster (nickname + real name), then set their own email and password. Already-claimed seats (Gams, Go Giants, Pauli) say Sign in instead.
7. To give a friend Admin tools, open Admin → **Players** → that person → **Make administrator**. Pool lists administrators and links back to them.

---

## If something looks wrong

- Week 2 on Schedule is expected. Home should show **Who are you?** + Join, not a `demo1234` picker.
- You cannot open Admin → sign in with your real administrator email (or the practice administrator via **Sign in** if you have not saved a real email yet).
- Practice email/password fails after you saved a real login → that is intended. Use your real email.
- A friend cannot join → they need invite code `SUNDAY26`. They should pick their existing name from the list (not invent a second “Gams”). If that seat is already claimed, they Sign in instead (or ask you).
