# Real mode, Demo mode, and Week 1 import

Plain-English playbook for the commissioner. You do **not** need to code. Phone-friendly.

Invite code for friends: **`SUNDAY26`**.

---

## Where the mode switch is (Admin)

1. Sign in as commissioner.
2. Tap **Admin** in the top-right of the header (gold link).
3. The **first card** on that page is **Real mode vs Demo mode**.
4. Two big buttons: **Real mode** | **Demo mode**. The gold one is the current mode. Tap the other to switch.

After you merge this change and Vercel finishes deploying, that switch is live.

- **Real mode** = **Week 1** (this NFL week). Week 2 practice picks are cleared and friends cannot open Week 2.
- **Demo mode** = Week 2 sandbox for you (commissioner) only.

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
| **Real mode** | **Join the pool** and **Sign in** only. No account picker. No practice passwords. The word “demo” is hidden. |
| **Demo mode** | Practice account picker on the home and sign-in pages. |

Practice emails (`…@survivesunday.demo`) cannot join or sign in as players in Real mode. `demo1234` is not shown.

---

## After you wipe practice seats (reset)

Home page = **Join** + **Sign in** only.

- `admin@survivesunday.demo` / `demo1234` will **not** work if you already saved a real commissioner login (reset removes the practice commissioner).
- Sign in with the real email you saved.
- Friends join with invite code **`SUNDAY26`** and their own email.

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

This is applied to the **live database** on deploy (and again when the site loads). Changing seed files alone is not enough.

To fix any other name: **Admin → Roster — nicknames and real names**.

---

## Then import Week 1 picks (when you are ready)

1. Admin → **Import week picks (CSV / paste)**
2. Week number: **1**
3. Upload or paste rows: `nickname,team` (or `email,team`)
4. Tap **Preview matches** and check every name.
5. Confirm.

Example file: `/examples/week1-picks-import.csv`

---

## Suggested order for the real season

1. Tap **Admin → Real mode** — friends land on **Week 1**, Week 2 practice picks are cleared, and the practice picker is hidden.
2. Save your **real commissioner login**, sign out, sign in with it.
3. Fix names on **Roster** if needed (John Stilo / Steve Venerus should already be patched).
4. When you want a clean Week 1 board, **Reset pool**.
5. **Import week 1 picks**.
6. Send friends to **Join the pool** with invite code **`SUNDAY26`**.

---

## If something looks wrong

- Home still shows a player picker or Week 2 → open **Admin** and tap **Real mode**.
- Mode buttons do nothing → refresh, then tap again. You must be signed in as commissioner.
- You cannot open Admin → sign in with your real commissioner email (or the practice commissioner via **Sign in** if you have not saved a real email yet).
- Practice email/password fails after you saved a real login → that is intended. Use your real email.
- A friend cannot join → they need invite code `SUNDAY26` and a unique nickname.
