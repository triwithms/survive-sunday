# Real mode, Demo mode, and Week 1 import

Plain-English playbook for the commissioner. You do **not** need to code. Phone-friendly.

Invite code for friends: **`SUNDAY26`**.

---

## Where the mode switch is (Admin)

1. Sign in as commissioner.
2. Tap **Admin** in the top-right of the header (gold link).
3. The **first card** on that page is **Real mode vs Demo mode**.
4. Two big buttons: **Real mode** | **Demo mode**. The gold one is the current mode. Tap the other to switch.

That switch is **live on `main`**.

- **Real mode** = **Week 1** (this NFL week). Practice picker is hidden. Week 2 is a real upcoming NFL week — friends can view the schedule and pick when it unlocks. Demo isolation does **not** hide Week 2.
- **Demo mode** = practice picker for you (commissioner). Same weeks, including Week 2.

---

## Commissioner login is READY

The first real commissioner account is **not** `admin@survivesunday.demo`. You create it yourself on Admin:

1. While Demo mode is still on (or using the practice commissioner), open **Admin**.
2. Scroll to **Your commissioner login**.
3. Enter **your real email** and a new password (at least 6 characters).
4. Tap **Save real commissioner login**.
5. Tap **Sign out and use the new login**.
6. Open **Sign in** and use that real email and password.
7. Confirm you still see **Admin** in the header. You should see a **Ready** chip on the login card.

**After that, commissioner login is ready.** Tell yourself: use the real email, not `admin@survivesunday.demo`.

If you turn on Real mode before you save a real email, you can still sign in once with the practice commissioner via **Sign in** (not the home-page picker) so you can finish this step. Friends never see that password.

---

## What friends see after Real mode

| Mode | What friends see |
|------|------------------|
| **Real mode** | **Who are you?** from the live roster, then **Join** (own email + password) or **Sign in**. No practice passwords. The word “demo” is hidden. |
| **Demo mode** | Practice account picker on the home and sign-in pages. |

Practice emails (`…@survivesunday.demo`) cannot join or sign in as players in Real mode. `demo1234` is not shown.

### Who are you? (claim your existing seat)

The list is the **live Admin roster** (current nicknames + real names), not a hard-coded file. Commissioner / non-player seats are left off.

1. Home or **Join the pool** → pick e.g. `Gams (Robert Gama)`.
2. Enter invite code **`SUNDAY26`**, **your own email**, and a password you choose.
3. That login attaches to the existing membership. Week 1 picks stay with that person — you do not get a second “Gams”.
4. If that seat already has a real (non-practice) email: **already claimed — Sign in instead** (or ask the commissioner).
5. Practice `@survivesunday.demo` seats (and leftover `@pending.survivesunday.local` placeholders) **are** claimable by the real person.
6. **One user, more than one role.** There is no separate “admin account.” If you already sign in with `robertgama@gmail.com` (Administrator), pick **Gams** on Join and use that same email and the password you already sign in with. That adds the **Player** role to the same user. Or **Sign in first**, then Join — you’ll see **You’re signed in — claim with one tap**. Then switch **Playing as Gams** | **Admin tools**. Do not invent a second email. If Join says the email already has an account, tap **I already have this login — Sign in to claim**.
7. When you have both roles, a gold switch appears: **Playing as Gams** | **Admin tools**. Player view hides Admin. Admin view shows Admin. Friends who are only players never see Admin tools.
8. On **Admin**, you can **Make administrator** for someone already in the pool (confirm first). They stay on the board. You can remove Admin later if at least one administrator remains. Roles live on a user↔roles list so a later **Watcher** (follow the board, no picks) can be added without starting over. Watcher is **not** in the app yet.
9. Nicknames still change on **Admin → Roster** or **Change nickname**. The list always shows the current names.

---

## After you wipe practice seats (reset)

Home page = **Who are you?** (live roster) + **Join** + **Sign in**.

- `admin@survivesunday.demo` / `demo1234` will **not** work if you already saved a real commissioner login (reset removes the practice commissioner).
- Sign in with the real email you saved.
- Friends pick themselves from the live roster, then join with invite code **`SUNDAY26`** and their own email + password. That attaches to the existing nickname seat (Week 1 picks stay). If the seat already has a real email, they Sign in instead.

---

## Reset pool (optional)

Real mode already uses Week 1. Use reset when you want a **clean** board before importing real Week 1 picks. You do **not** have to reset today.

1. Admin → **Reset pool** (the red card under the mode switch).
2. Read the preview.
3. Tap **Start reset…**
4. Leave **Also switch to Real mode after reset** ticked (recommended).
5. Type **`RESET`**.
6. Tap **Yes, reset the pool**.

### What reset does

- Clears all picks.
- Sets everyone who stays to **undefeated** with a fresh mulligan.
- Removes practice accounts (`…@survivesunday.demo`), including the old practice commissioner if you already saved a real login.
- Sets the pool to **Week 1**.
- Keeps the schedule, games, your commissioner login, and real friends who joined with their own email.

### What reset does **not** do

- It does **not** delete the website, password settings, or Google login.
- It does **not** remove your commissioner account.
- It does **not** remove friends who joined with a real email.

This cannot be undone. If you only wanted to hide the practice picker, tap **Real mode** and skip reset.

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

Most of this is **already done** (evening 13 Sep 2026): Real mode is on, Week 1 picks are imported, Who are you? is live, Gams / Go Giants / Pauli seats are claimed.

1. Confirm **Admin → Real mode** — friends land on **Week 1**, the practice picker is hidden, and Week 2 stays on the schedule.
2. You already have a **real commissioner login**. Sign in with that email. Same email can hold **Player + Administrator** — use **Playing as Gams** / **Admin tools**.
3. Fix names on **Roster** only if needed (John Stilo / Steve Venerus / Pauli / Go Giants / JaJa should already be right). JaJa’s pick backup (copy from Gams) is on that same Roster card, or **Account → Pick backup**.
4. **Do not Reset pool** unless you intend to wipe the imported Week 1 board.
5. Add **Resend** keys on Vercel (`RESEND_API_KEY` + `RESEND_FROM_EMAIL`) and Redeploy — then test **Forgot password** once. That is the invite blocker.
6. Then send friends to **Join the pool** with invite code **`SUNDAY26`**. They pick their name from the live roster (nickname + real name), then set their own email and password. Already-claimed seats (Gams, Go Giants, Pauli) say Sign in instead.
7. To give a friend Admin tools, open Admin → **Administrators** → **Make administrator**.

---

## If something looks wrong

- Home still shows a player picker → open **Admin** and tap **Real mode**. Week 2 on Schedule is expected.
- Mode buttons do nothing → refresh, then tap again. You must be signed in as commissioner.
- You cannot open Admin → sign in with your real commissioner email (or the practice commissioner via **Sign in** if you have not saved a real email yet).
- Practice email/password fails after you saved a real login → that is intended. Use your real email.
- A friend cannot join → they need invite code `SUNDAY26`. They should pick their existing name from the list (not invent a second “Gams”). If that seat is already claimed, they Sign in instead (or ask you).
