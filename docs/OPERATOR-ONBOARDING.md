# Survive Sunday: operator onboarding

How to sell a pool, hand it to a new administrator, and keep the family pool safe. One website: [survive-sunday.vercel.app](https://survive-sunday.vercel.app). Sign-in is email and password. There is no invite-code login and no in-app checkout.

Apply the database migration once before the first sold pool. A Redeploy does not do that. See [DEPLOY.md](../DEPLOY.md) section 4.

## 1. One app, many pools

One web address hosts more than one NFL survivor pool.

- **Separate pools.** One pool cannot see another pool’s players, roster, or picks.
- **Shared schedule.** Every pool uses the same NFL schedule, teams, and scores. Nobody enters scores by hand.
- **Family pool.** The live family pool stays as it is. Selling another pool does not change its players or picks. Switch back and look before you tell a buyer they are live. Do not reset it.

## 2. Who does what

- **Robert (platform owner)** hosts the app, sells pools, creates the pool and the first administrator login when someone buys one, and helps pool administrators when the app itself is broken.
- **Pool administrator** runs only their pool. They add players, set passwords, text those passwords, and answer their players. They collect entry fees outside the app.
- **Player** signs in with email and password, makes weekly picks, and looks at their own pool.

## 3. Sell and handoff checklist

Follow this when you sell a pool. Payment stays outside the app (e-transfer, cash, or whatever you already use).

1. **Agree and get paid.** Confirm the pool name, size, and mulligan (one free loss, or no mulligan). Collect payment. Write down the administrator’s real email, and whether they already sign in to Survive Sunday. Do not add their players to the family pool.
2. **Start the pool.** Sign in with your own email and password. Open **Settings → Start a pool**. Enter their name and mulligan. Tap **Create pool**. You land in the new pool as its administrator and as a player. The family pool is unchanged. A switcher appears on Settings because you are now in more than one pool. Stay on the new pool while you add people. A person who can already sign in can also open **Settings → Start a pool** themselves. You do not have to start it for them if you would rather they own it from the first tap.
3. **Create their login** (when you started the pool). **Admin → Players → Add user.**
   - New person: their email and a temporary password. Copy the text the form gives you and text it yourself. The app does not email passwords. Do not put the password in git, chat, or this file.
   - Person who already signs in: use that same email and leave the password blank. Typing a password here changes it for every pool on that login.
   - On their row, tap **Make administrator**.
4. **Send the welcome email** in Appendix A. Subject with no emoji. Put the real email and temporary password only in that private email, not in a group chat.
5. **Short walkthrough** if they want one. Show both ways to add players: **Admin → Players** (you set a password and text it) and **Admin → Pool → Shared join link** (they choose their own email and password). Mulligan is on **Pool** too. Ten minutes is enough.

You are still a player in their pool, and an administrator until you hand it over. You cannot remove your own seat. When they can open Admin for their pool:

- **Stay for support:** leave yourself as an administrator. They can remove your player row later if you should not be on their board.
- **Step out:** **Admin → Pool → Hand the pool to someone else.** Type their nickname. You lose Admin on this pool only. You stay a player until they remove you (**Admin → Players**, your row, Remove). You remain an administrator of the family pool.

Then switch back to the family pool and confirm its players and picks look the same.

## 4. New pool administrator: first hour

1. Open [survive-sunday.vercel.app/login](https://survive-sunday.vercel.app/login). Sign in with the email and temporary password Robert sent. If you already had a login, use that password.
2. Settings has no password box. To choose your own password, sign out and use **Forgot password** on Sign in. A 6-digit code arrives by email. Check spam.
3. If Robert told you to start the pool yourself: **Settings → Start a pool** (name and mulligan). You become the administrator.
4. If you are in more than one pool, the switcher is on Settings. Pick your pool before you add anyone. If the screen says you are playing, switch to **Admin tools**. Admin in the bottom bar is only for a pool you administer.
5. Add players either way, or both. They are optional, not a choice you have to make once.
   - **You set the password:** **Admin → Players → Add user**. Nickname, email, and a temporary password. Text each person their own login (Appendix B, plus the password in a separate direct message). If that email already signs in somewhere else, leave the password blank.
   - **They set the password:** **Admin → Pool → Shared join link → Create link**. Copy that one link and send it to the group. Each person opens it, enters their own email, password, and display name, and lands in this pool only. **New link** replaces the old one. **Turn off** stops it. You cannot copy the old link again after you leave the page.
6. Mulligan changes live under **Admin → Pool**.

You only see the pool you are in. You cannot open another pool’s roster or picks.

## 5. How players get in

- They open the same website and sign in with **email and password**. Returning players always use Sign in, plus **Forgot password** if they need it. The same steps are in the app under **Help → How to sign in** (players) and **Help → For Administrators**.
- Two ways in, both optional:
  - The administrator creates the account and texts a temporary password.
  - Or the administrator shares one pool join link. The player opens it and chooses their own email, password, and display name. That link joins only that pool. It is not a code, and it does not show a list of people.
- A personal join link, if the administrator sends one for a seat they already created, only attaches email and password to that seat. After that, Sign in is the way back.
- **Forgot password** is on the Sign in page.
- They see picks and standings for their pool. If a login is in two pools, Settings shows a switcher. One pool means no switcher.
- They do not see Admin unless someone made them an administrator of the pool they are in.

## 6. Boundaries

- An administrator or player only sees the pool their login is in. Admin of one pool is not Admin of another.
- There is no public list of pools or players. People need the web address and their own email and password.
- Robert has no extra screen that lists every pool. He only sees a pool he has a seat in.
- The family pool stays separate. Do not reset it when you set up a sold pool. It has no shared join link until an administrator creates one. Leave that off.
- NFL schedule and scores are shared. Rosters, picks, locks, and mulligan are not.

## 7. Support

- **Players ask their pool administrator** for passwords, login help, and rule questions. Robert does not support players directly.
- **Pool administrators ask Robert** when the app is broken, a pool will not start, or a sign-in failure is not fixed by Forgot password or a password the administrator sets.

## 8. What is manual today

| | Today | Not in this version |
|---|---|---|
| Payment | Outside the app | In-app checkout |
| Starting a pool | A signed-in person uses **Settings → Start a pool**. When you sell one, you still do that and create their login. | A public signup page |
| Players | Administrator adds them and texts a password, or shares one pool join link so they choose their own email and password. A personal link can still claim a seat the administrator already created. | A public people list, or a code that signs you into every pool |
| Web address | One shared URL | A different web address per pool |

No checkout and no extra sign-in method are part of this version. **Hand the pool** is already how Admin moves to an existing member.

Charging other organizers is also a hosting choice. Vercel’s free Hobby plan is for personal use. Once you sell pools, plan on a paid Vercel seat. That is not a button in the app.

## 9. Short FAQ

1. **Can players in one pool see picks in another?** No.
2. **How do players sign in?** Email and password on Sign in, or **Forgot password**. If the administrator texted a temporary password, they use that. If they got a shared join link, they open it once and choose email and password. There is no people list and no pool-code login.
3. **What if they forget it?** **Forgot password** on the Sign in page. The code comes by email.
4. **How do I collect entry fees?** Outside the app. This version does not take payment.
5. **Can an administrator set a player’s password?** Yes. **Admin → Players**, that person, **Set a password**. Copy the text and send it. The app does not email it. If that email already signs in, leave the password blank unless you mean to change it for every pool on that login.
6. **Is the family pool mixed in with a sold pool?** No. It stays separate. Do not reset it.
7. **How do scores update?** From the shared NFL schedule. You do not type them in.
8. **Can players sign themselves up?** Only if their administrator shares the pool join link from **Admin → Pool**. That page asks for email, password, and display name. It does not list people, and it does not accept a pool code. Otherwise the administrator creates the account and texts a password. Returning players use Sign in.
9. **What address do we send?** [https://survive-sunday.vercel.app](https://survive-sunday.vercel.app)
10. **Who do players contact if they are locked out?** Their pool administrator.

## Appendix A: Welcome email (Robert → new administrator)

Email can be a normal letter. The subject has no emoji.

**Subject:** Your Survive Sunday pool is ready

Hi [Admin name],

Your NFL survivor pool is set up.

- **App:** https://survive-sunday.vercel.app
- **Sign-in email:** [Admin email]
- **Temporary password:** [Temp password]

Next:

1. Sign in at the link above. Settings has no password box. To choose your own password, sign out and use Forgot password on the Sign in page.
2. Add players either way. Admin → Players: you set a temporary password and text it. Or Admin → Pool → Shared join link: one link, and each player chooses their own email and password. If an email already signs in, do not type a new password on Add user.
3. If you set the password, text the note in your operator guide, and send the email and temporary password in a separate direct message.

Reply if something in the app is broken. Your players should come to you for passwords and rules.

Robert

## Appendix B: Player text

One text, 160 characters or fewer, plain GSM-7 (no emoji). This one is 147 characters. Send the email and temporary password in a separate direct message, not this text and not the group chat.

> NFL Survivor pool is live! Go to https://survive-sunday.vercel.app. Log in with your email and temp password sent separately. Reply with questions.

## Appendix C: Before you sell widely

1. **Passwords travel in texts and email.** Send each password in a direct message to that person. Do not drop passwords in a group chat, a screenshot, git, or this file.
2. **Admin stays on one pool.** Before you sell the next one, sign in as that administrator and confirm they cannot see the family pool’s roster or picks.
3. **Players will still write to you if nobody told them otherwise.** The welcome email says players ask their own administrator.
4. **There is no backup button for a pool administrator.** Keep the database backups you already have. Removing a player deletes that seat’s picks.
