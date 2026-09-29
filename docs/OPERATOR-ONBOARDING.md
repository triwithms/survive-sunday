# Selling and onboarding a pool

Plain steps for Robert (platform owner) when someone pays to run their own pool on Survive Sunday. This is the v1 process. Several steps are still manual. There is no checkout, no approve button, and no separate “platform owner” screen.

One website: [survive-sunday.vercel.app](https://survive-sunday.vercel.app). Sign-in is **email + password** only. Do not send an invite code as the way in. Forgot password stays on the Sign in page.

The family pool (BM Boys) is a normal pool. Starting or selling another pool does not rewrite its players or picks. Switch back and look before you tell the buyer they are live.

Apply the database migration once before the first sold pool. A Redeploy does not do that. See [DEPLOY.md](../DEPLOY.md) section 4.

## 1. What Robert does

Payment happens outside the app (e-transfer or whatever you already use). Write down, before you touch the app:

- Pool name they paid for
- Mulligan: one free loss, or no mulligan (one loss and you are out)
- The administrator’s real email, and whether they already sign in to Survive Sunday
- That you will not add their people to the family pool

Then:

1. Sign in with your own email and password.
2. Open **Settings** (Account).
3. **Start a pool.** Type their pool name. Pick the mulligan you agreed. Tap **Create pool**.
4. You land in the new pool as its administrator and as a player. The family pool is unchanged. A pool switcher appears on Settings because your login is now in more than one pool. Stay on the new pool while you add people. The header and Admin tools follow the pool you are in.
5. Open **Admin → Players → Add user** for the buyer.
   - **New person** (no Survive Sunday login yet): their email and a temporary password. The form gives you text to copy. Text that password yourself. The app does not email passwords. Do not put the password in git, chat, or this file.
   - **Person who already signs in** (including anyone in the family pool): use that same email and **leave the password blank**. Typing a password here changes the password on that login for every pool they belong to.
6. On their row, tap **Make administrator**. They keep playing. You are still an administrator too.
7. Tell them the site URL, the email you entered, and (if you set one) the temporary password. Tell them to sign in, open Settings, and switch to **Admin tools** if they also have a player seat.
8. When they confirm they can see **Admin** for their pool, decide your own seat:
   - **You stay for support:** leave yourself as an administrator. You are also a player on their board until they remove you. You cannot remove your own seat.
   - **You step out:** **Admin → Pool → Hand the pool to someone else.** Type their nickname and confirm. You lose Admin on this pool only. You stay a player until they remove you. You remain an administrator of the family pool. They must be the one to remove your player row (**Admin → Players →** your row **→ Remove**). The app will not let you remove yourself.

There is no in-app approve step. Creating the pool, or telling an existing login they may create it themselves, is the approval.

If the buyer already has a login and you would rather they own it from the first tap: skip steps 3–6. Tell them to sign in, open **Settings → Start a pool**, and use the name and mulligan you agreed. You are not in their pool unless they add you.

Do not **Reset pool** on the family pool. Do not run a seed. Do not delete the test or sold pool from the database by hand.

## 2. What the new pool administrator does

1. Open [survive-sunday.vercel.app/login](https://survive-sunday.vercel.app/login).
2. Sign in with the email Robert used and the temporary password he texted. If they already had a login, use that email and their existing password.
3. If they forget it later: **Forgot password** on Sign in. A 6-digit code arrives by email. Check spam.
4. If Robert created the pool: Settings shows their pool. If they are in more than one pool, the switcher is on Settings — pick their pool before adding friends. If Robert told them to create it: **Settings → Start a pool** (name + mulligan). They become the administrator.
5. If the screen says they are playing: Settings → switch to **Admin tools**. Admin in the bottom bar is only for a pool they administer.
6. Set the roster: **Admin → Players → Add user** for each friend (nickname, and email or cell if you have it).
   - Friend who should sign in today: add their email and a temporary password, then text the copy-ready lines. Same warning: if that email already signs in somewhere else, leave the password blank.
   - Friend who will claim an open seat: add them without a real email if you want, then **Copy join link** on that row and send it only to that person. The link attaches their email and password to that seat in this pool. It is not a code for the whole app.
7. Change a password later from that person’s row: **Set a password**, save, copy the text, and text it. The app does not email it.
8. Basic settings are on **Admin → Pool**: mulligan (one free loss, or turn it off from a week), and **Hand the pool** if they ever want another member to run it. They can **Make administrator** on a player row if two people should both have Admin. That does not remove the first administrator.

They only see and edit the pool they are in. They cannot open the family pool’s roster, picks, or reset.

## 3. What players do

1. Open the same website. Sign in with **email and password**.
2. First time: use the email and temporary password their administrator texted, or open the personal join link that administrator sent and set an email and password on that seat. After that, Sign in is the way back.
3. They do not enter a pool code. A code is not the sign-in.
4. **Forgot password** is on the Sign in page if they lose it.
5. They pick, and they see standings, for the pool their login belongs to. If they are in two pools, Settings shows a switcher. One pool means no switcher.
6. They do not see Admin unless someone made them an administrator of the pool they are currently in.

## 4. Boundaries

- **One app, separate pools.** Everyone uses the same URL. Rosters, picks, locks, mulligan, and who is still in are per pool. The family pool and a sold pool do not share players.
- **Admin is per pool.** Being an administrator of one pool does not grant Admin on another. Robert has no extra “see every pool” screen in this version. He only sees a pool he has a seat in.
- **NFL schedule and scores are shared.** One slate feeds every pool. A score update is not a second copy of the season.
- **Sign-in is email + password.** Personal join links only claim a seat that an administrator already created. They are not a second way to log in with a shared code.
- **No Stripe in this version.** Take payment before you create the pool. When checkout exists later, it sits on that sale — before **Start a pool** — not on weekly picks. SMS packs and top-X lists are also later. They are not part of onboarding. **Hand the pool** is already the in-app way to give Admin to an existing member.

Charging other organizers is a hosting decision as well as a product one. Vercel’s free Hobby plan is meant for personal use. Once money changes hands, plan on a paid Vercel seat. That is not a button in the app.

## 5. Checklist when you sell a pool

Copy this and tick it.

- [ ] Price agreed and paid outside the app. Name, mulligan, and admin email written down.
- [ ] Production migration from [DEPLOY.md](../DEPLOY.md) section 4 has been applied once.
- [ ] Signed in as yourself. Did not reset or re-seed the family pool.
- [ ] **Settings → Start a pool** with their name and mulligan — or they already had a login and you told them to start it themselves.
- [ ] Switcher shows the new pool and the family pool. You added people only while the new pool was selected.
- [ ] Buyer added with the right email. Password set and texted only if this email is new. Password left blank if they already sign in.
- [ ] **Make administrator** done. They signed in and can open Admin for their pool only.
- [ ] You either stayed on as a second administrator, or you handed the pool and they removed your player seat.
- [ ] They know how to add friends, text a temporary password, or send one personal join link per open seat.
- [ ] You switched back to the family pool and confirmed its players and picks look the same.
- [ ] You did not send a shared invite code, and you did not put a password in chat, git, or this file.
