# Real mode, Demo mode, and Week 1 import

Plain-English playbook for the commissioner. You do **not** need to code. Phone-friendly: use **Admin** at the top of the app.

Invite code for friends: **`SUNDAY26`**.

---

## What the two modes mean

| Mode | What friends see | What you can do |
|------|------------------|-----------------|
| **Real mode** | Join + Sign in only. No account picker. The word “demo” is hidden. | Run the real season. Import Week 1 picks. |
| **Demo mode** | Practice account picker on the home and sign-in pages. Demo copy is allowed. | Try the app as different players. Testing lock toggle (Admin only). |

You switch modes yourself. The site does not change by itself.

---

## How to switch modes

1. Sign in as commissioner (email + password, or **Enter as commissioner** while still in Demo mode).
2. Tap **Admin** in the header.
3. Under **Pool mode**, tap **Switch to Real mode** or **Switch to Demo mode**.
4. You should see a short confirmation. Refresh if the home page still looks old.

**Tip:** Switch to **Real mode before you invite friends**, so they never see the practice picker.

---

## How to reset the pool (before real Week 1)

Use this when the board still has practice picks and you want a clean start.

1. Stay signed in as commissioner → **Admin**.
2. Scroll to **Reset pool**.
3. Read the preview (how many picks will clear, which practice accounts leave).
4. Tap **Start reset…**
5. Leave **Also switch to Real mode after reset** ticked (recommended).
6. Type **`RESET`** in the box.
7. Tap **Yes, reset the pool**.

### What reset does

- Clears all picks.
- Sets everyone who stays to **undefeated** with a fresh mulligan.
- Removes practice accounts (`…@survivesunday.demo`) except the commissioner.
- Sets the pool to **Week 1**.
- Keeps the schedule, games, your commissioner login, and real friends who joined with their own email.

### What reset does **not** do

- It does **not** delete the website, passwords settings, or Google login.
- It does **not** remove your commissioner account.
- It does **not** remove friends who joined with a real email.

This cannot be undone. If you only wanted to hide the practice picker, use **Switch to Real mode** and skip reset.

---

## Then import Week 1 picks

1. Admin → **Import week picks (CSV / paste)**
2. Week number: **1**
3. Upload or paste rows: `nickname,team` (or `email,team`)
4. Tap **Preview matches** and check every name.
5. Confirm. Changes are written to the audit log.

Example file: `/examples/week1-picks-import.csv`

After import, open **Home** or **Scores** and confirm Week 1 looks right.

---

## Suggested order for the real season

1. Sign in as commissioner.
2. **Reset pool** (with “switch to Real mode” ticked) **or** switch to Real mode, then reset if the board is still full of practice data.
3. **Import week 1 picks**.
4. Send friends to the site → **Join the pool** with invite code **`SUNDAY26`** (or **Sign in** if they already have an account).
5. They pick as usual. You can still correct a pick later with **Import week picks**.

---

## If something looks wrong

- Home still shows a player picker → you are still in Demo mode. Open Admin and switch to Real.
- Board still has old practice picks → run Reset, then import again.
- You cannot open Admin → you are not on the commissioner account. Sign in with that email.
- A friend cannot join → they need invite code `SUNDAY26` and a unique nickname.
