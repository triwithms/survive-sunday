# Survive Sunday — owner handoff

**New Chief of Staff / crash recovery:** [`docs/CHIEF-OF-STAFF-TAKEOVER.md`](CHIEF-OF-STAFF-TAKEOVER.md) — how a new CoS takes over if Grok Bot freezes. Then this file + [`docs/FILE-MAP.md`](FILE-MAP.md).

## Agent cost / how to work

**#1 cost rule:** For specs, FILE-MAP lookups, QA critic scoring, copy, and checklists, use free tiers in order — **free Grok, then free Claude, then free Gemini** — before any paid Grok Bot / Cursor coding agents. Paid agents only for the actual code PR/merge. Aim to save ~30–50% usage by keeping planning and critic loops off paid runs.

**AI split:** **Free Grok** (and the free cascade: Grok → Claude → Gemini) for planning, research, copy, and checklists. **Paid Cursor / Grok Bot for actual code PRs only.** Details: [`docs/FREE-GROK.md`](FREE-GROK.md).

**Free-AI entry (copy-paste prompts):** [`docs/FREE-AI-START-HERE.md`](FREE-AI-START-HERE.md) · [`docs/FREE-AI-QUEUE.md`](FREE-AI-QUEUE.md) · [`docs/MNF-WRAP-FREE-AI.md`](MNF-WRAP-FREE-AI.md) · [`docs/DOCS-REFRESH-FREE-AI.md`](DOCS-REFRESH-FREE-AI.md).

**Docs freshness:** When any free or included usage allotment is near empty (owner flags Usage low, or it is known to be low), refresh HANDOFF / FREE-GROK.md / FILE-MAP with shipped changes **before** starting more work — so the next session (next free tier, or next week’s included Grok Bot / Cursor usage) starts from current docs. Applies to free Grok → free Claude → free Gemini **and** to Grok Bot / Cursor included weekly usage. Help only if a user/admin process changed. Do not wait until quota is fully gone.

Paste-ready brief: [`docs/FREE-GROK.md`](FREE-GROK.md) (**free AI first** — Grok → Claude → Gemini).

## Multi-bot control (Chief of Staff)

**Chief of Staff (Grok Bot)** is the lead director. Takeover playbook: [`docs/CHIEF-OF-STAFF-TAKEOVER.md`](CHIEF-OF-STAFF-TAKEOVER.md). Specialists work **on assignment only** (not a discovery swarm): Safety/DB, Docs Sync, Codebase Audit, QA.

Chief of Staff turns friend-language product asks into small ordered jobs, enforces the **#1 cost rule** (free Grok → free Claude → free Gemini → paid only for code PRs), and stops duplicate PRs / credit burn. Specialists critique or ship in their lane when asked or on a clear trigger.

Free-AI drafting: [`docs/FREE-GROK.md`](FREE-GROK.md). Start here: [`docs/FREE-AI-START-HERE.md`](FREE-AI-START-HERE.md).

This is the **keep-up guide** for the pool app. It is written for a **non-coder**. Use **click-by-click** steps here, then paste a starter prompt into a **new chat** when something breaks or you want a small change.

**Intended tool:** **free Grok**, then **free Claude**, then **free Gemini** (topic-split chats; paste prompts from **section 12**).

**HANDOFF / Help update rule:** Do **not** rewrite this file (or Help) on every small code PR. Update the snapshot at most **once per day** or at the **end of a batch**. Tiny logo/spread/sort fixes do not get a HANDOFF pass. Prefer GitHub pencil + **free Grok**, then **free Claude**, then **free Gemini** for docs. Coding agents: do not read or rewrite `docs/HANDOFF.md` unless the owner’s prompt says “update HANDOFF”.

**Not the intended tool:** paid **Grok Bot**, Cursor desktop agents, or other expensive coding bots. Those are optional later if a change is too big for a basic chat — not the default path.

**Human path that stays the same:** you merge GitHub **pull requests** yourself, then click through **Vercel** (env vars, Redeploy) when this file says to. A chat can tell you which buttons to press. It cannot press them for you.

**Source of truth:** this file + the GitHub **`main`** branch. If a chat and this file disagree, trust the repo. If this file and an open pull request disagree, trust `main` for what friends see **today**, and the open PR list in **section 10** for what is **not live yet**.

**Never paste secrets** (passwords, `AUTH_SECRET`, `DATABASE_URL`, API keys) into a chat, a screenshot, or a commit.

**Snapshot (19 September 2026):** latest `main` is what friends see on [survive-sunday.vercel.app](https://survive-sunday.vercel.app). The pool is on **Week 2**. Header **Week N** is the **pool** week from the slate (read-only); a friend’s personal next-pick week can still differ ([#122](https://github.com/triwithms/survive-sunday/pull/122)). Bottom nav is **live**: **My pick · Selections · Leaderboard · Scores · Schedule · Standings**; header **?** for Help ([#126](https://github.com/triwithms/survive-sunday/pull/126)). Live tonight:

- **CRITICAL — production data:** A Vercel Production build is `npm run build` → `next build` only. It does **not** run `ensure-production-db`, `prisma db push`, or seeds. Scheduled jobs (missing-pick reminders, ensure-week) do **not** wipe or reseed the pool. Never reattach those scripts to the build. Details: [DEPLOY.md](../DEPLOY.md) section 4.

- **Cannoli Stuffer (Mike Frigo) has Joined.** Email codes were failing. A one-shot temporary password **`Cannoli1!`** was already written on Neon, and **Admin → Set a temporary password** is live for anyone else. A Redeploy does **not** rewrite passwords. Sign in: [survive-sunday.vercel.app/login](https://survive-sunday.vercel.app/login) with his email and password. His sign-in email is on **Admin → Roster**. He should change the password after he is in.

- Cold open (`/`) is **Sign in**. Join via a personal or invite link (`/join?who=` / `/login?invite=`). After Sign in, default landing is **My pick**. **Selections** is `/pool`. **Player / Administrator** roles (not a special admin account) + **Playing as … / Admin tools** in **Account** — roles merged [PR #19](https://github.com/triwithms/survive-sunday/pull/19)
- Safari sign-in + **Account → Sign out** — merged [PR #18](https://github.com/triwithms/survive-sunday/pull/18)
- **Week 2 schedule restored** in Real/live (viewable; Demo isolation is practice UX only — it does **not** hide the Week 2 slate) — merged [PR #22](https://github.com/triwithms/survive-sunday/pull/22)
- **Next-week picks unlock per player** as soon as *their* current-week game has started (not after Monday Night Football). Week 2 pick UI is live for those players and for new joiners who missed a Week 1 pick path. Friends still waiting on their own Week 1 kickoff keep the normal Week 1 change-pick flow.
- Leaderboard (pool in/out): **still in → out**, then fewest losses / most weeks survived; among equals clean record (no 💩) → live win margin of finished picks → nickname. No week chip (season race). Selections is the weekly pick list. **My pick**, **Selections**, and **Scores** open on your current pick week; future weeks are on **Schedule**.
- ESPN live scores + injuries; **Standings (NFL W-L) syncs from ESPN** (not the demo `week2-standings` seed); no player-facing demo League copy in Real mode
- Real **Week 1 picks imported** for the BM Boys including **Go Giants**, **Pauli**, and **JaJa** (Jacquie Gama). Pauli’s nickname is **Pauli**. JaJa’s Week 1 pick is **DAL** (Dallas — not Gams’ KC). Her Join seat uses a practice `@survivesunday.demo` email so it stays **claimable** (not `@pending.survivesunday.local`).
- **Pick backup:** Off by default. Optional copy-from-member within **30 minutes** of lock (no 💩). Optional ranked leftover (~**2 minutes** before lock) stamps 💩 and that player cannot be the official winner. Server jobs apply this — opening the app is not required. Keep Help general; do not name a specific friend.
- **Pick-change until kickoff** — every week: you can still change an existing pick until **that team’s** kickoff if the new game has not started.
- Forgot password is on `main`. Production Resend is set (verified domain **triwithms.com**; From `Survive Sunday <noreply@triwithms.com>` — **section 4**). New-domain mail may land in **spam**/junk. Sign in is **email + password** (not a sign-in code first).
- **Personal Join links** — Admin → **Personal Join links** → one **Copy** per friend who has not Joined (`/join?who=cannoli-stuffer` when the nickname is unique; otherwise `/join?seat=…`). Opens Join with that seat already picked. Invite code `SUNDAY26` is filled in. If the seat is already claimed, the friend sees Sign in — not a broken form. Send one link per friend; do not blast one link to the group chat. Roster has the same Copy button, without extra wording. **Help → Getting started**.
- **Home Screen prompt** — after Sign in on a phone (not already the Home Screen icon), a card asks: **Do you want to add NFL Pool to your Home Screen?** **Yes** = Android native Install or iOS … beside the URL → scroll → Share (□↑) → Add to Home Screen → Add. **Not now** = ask again next Sign in (no 3-day timer). **No** = never auto-prompt; Help top **Install on Home Screen** reopens Yes. If `installed` but they are back in the browser, reset to pending (icon deleted). Desktop never shows. Standalone never shows; mark installed. Code: `src/components/features/a2hs/`.
- **Share Leaderboard / Scores as a picture** — merged [PR #45](https://github.com/triwithms/survive-sunday/pull/45). Header **Share** sends the page **link** (not a picture); it is hidden on Admin and Settings. Picture share has no extra button on the Leaderboard/Scores screen: **press and hold the page title**, or **tap the week label (gold W#) three times**. Then pick full long picture (always offered) or a shorter / split option → Make picture → Save or Send. The picture leaves off nav, tabs, **Details ›**, and “tap for details.” Help documents both. Does not change picks, Join, Sign in, or lock.
- **Scores Details ›** — merged [PR #46](https://github.com/triwithms/survive-sunday/pull/46). Each game card shows gold **Details ›** (live, Final, and upcoming) so friends know the card opens more info.
- **My pick Details ›** — gold **Details ›** on each team (same sheet as Scores: preview before kickoff, highlights after). **Pick** stays the main action; the row does not open Details. Close returns you to My pick. Hidden when that team has no Week-N matchup we can resolve.
- **Videos** — merged [PR #51](https://github.com/triwithms/survive-sunday/pull/51). Not a bottom tab. Clips live in Scores / Schedule → **Details**. **This 2026/27 season only** — [PR #52](https://github.com/triwithms/survive-sunday/pull/52). **Previews until kickoff, then highlights** — [PR #54](https://github.com/triwithms/survive-sunday/pull/54). **No in-app YouTube player** — thumbnail + title + **Watch on YouTube** (NFL blocks embeds). Role switch is in **Account** only. **Scores** opens on your pick week and will not open future weeks (browse those on Schedule).
- **Spreads and logos:** real ESPN favourites written **“BUF favoured by 4.5”**. Team marks are **local-only** transparent helmets at `public/helmets/{abbr}.png` — no white plates, no ESPN CDN ([#119](https://github.com/triwithms/survive-sunday/pull/119), [#124](https://github.com/triwithms/survive-sunday/pull/124)). Never letter badges.
- **Notifications:** Account **notifyPref** is Email / SMS / both / none (`NotificationPrefsForm`). Admin **Send test to me**. Production `NOTIFY_MODE` is **`allowlist`** (`NOTIFY_ALLOWLIST` working) — **keep allowlist** until Robert says **`live`** ([#133](https://github.com/triwithms/survive-sunday/pull/133)). Password-reset and sign-in codes are **not** gated by prefs. Ops notes (Resend From, Twilio, US Email, no Admin CC): **section 4**. The first-run prompt still asks friends to **add their cell for SMS reminders** (**Not now** is fine).
- **Eliminated:** My pick shows a near-full **YOU'RE OUT** overlay; pick controls off; server still refuses ([#128](https://github.com/triwithms/survive-sunday/pull/128)).
- **Icons / PWA** — NFL Pool football mark for Home Screen and browser ([#127](https://github.com/triwithms/survive-sunday/pull/127)).
- **Invite sign-in** — `/login?invite=` peeks email + nickname only (no session) ([#130](https://github.com/triwithms/survive-sunday/pull/130)).
- Help **topic menu** ([#108](https://github.com/triwithms/survive-sunday/pull/108)); Leaderboard season-end tiebreak **collapsed** until tapped ([#118](https://github.com/triwithms/survive-sunday/pull/118)); team unit pages list **healthy starters, then injured** ([#121](https://github.com/triwithms/survive-sunday/pull/121)); slate/injury last-good cache ([#120](https://github.com/triwithms/survive-sunday/pull/120)).
- Free-AI queue docs: [`FREE-AI-START-HERE`](FREE-AI-START-HERE.md) / [`QUEUE`](FREE-AI-QUEUE.md) / [`MNF-WRAP`](MNF-WRAP-FREE-AI.md).
- **Pool rules — mulligan** + **Hand the pool to someone else** — administrator can turn off the free mulligan from a chosen week (one-and-done; already-scored weeks stay) and give Admin to another existing member (they keep playing; you stay as a player). Different from **Make administrator**.
- Team full-season schedule is **not** live ([PR #132](https://github.com/triwithms/survive-sunday/pull/132) — **HOLD**).

The Real-mode playbook is [`docs/REAL-MODE.md`](./REAL-MODE.md). Earlier handoff refreshes ([PR #13](https://github.com/triwithms/survive-sunday/pull/13), [PR #15](https://github.com/triwithms/survive-sunday/pull/15)) are **superseded by this file**.

**Friends:** do **not** hold forever. The board, roles, Week 2 slate, and Week 1 imports are live. Cold open is Sign in; Join is via a personal or invite link. **Do not send personal Join links** until you have tested **Forgot password** once (you should receive a 6-digit code; check spam/junk — new-domain mail from **noreply@triwithms.com** may land there). Without a working reset, friends who forget their password are stuck. After that, copy one Admin link per friend — do not send one blast to the whole group chat.

---

## 1. What Survive Sunday is

A **private NFL survivor pool** for friends (2026/27 season). Canadian English (`en-CA`).

**Core loop only (protect this first):**

1. Each player picks **one team to win** that week.
2. After lock (first kickoff), the group can see **everyone’s picks**.
3. The board shows who is still **in** (undefeated / one loss) vs **out** (eliminated).

Rules the live app already enforces:

- You cannot reuse a team later in the season (win or lose).
- First wrong **or missed** pick burns the mulligan → **one loss** (unless the administrator turns the mulligan off).
- Second loss → **eliminated**. If the administrator switches to **one-and-done** from a week, one loss from that week onward puts a player out.
- Bye-week teams are off the board.
- **Administrator** is a role on a user (merged PR #19), not a special account. The same person can play (e.g. Gams) and use Admin tools. A leftover spectator administrator seat stays off the player board. **Hand the pool** gives Admin to another existing member; they keep playing; you stay as a player and lose Admin.

Entertainment among friends. Not a gambling service.

---

## 2. Where things live

| What | Where |
|------|--------|
| Code (GitHub) | [github.com/triwithms/survive-sunday](https://github.com/triwithms/survive-sunday) |
| Live site | [https://survive-sunday.vercel.app](https://survive-sunday.vercel.app) |
| Host (Vercel) | Team **nfl-pool**, project **survive-sunday** |
| Database | **Neon Postgres**, wired through Vercel as `DATABASE_URL` |

**Words in one line:** GitHub stores the code. Vercel builds and hosts the website. Neon stores players, picks, and results.

Invite code for friends: **`SUNDAY26`**. Do not send it out until you are ready (see snapshot).

---

## 3. How it’s built (stack)

Short names you will see in chats. One-line meaning only:

| Name | Meaning |
|------|---------|
| **Next.js App Router** | The website framework. Screens live under `src/app/`. |
| **Auth.js** (also called NextAuth) | Sign-in / stay-logged-in. Files: `src/lib/auth.ts`, `src/app/api/auth/`. |
| **Prisma** | Talks to the database. Shape of the data: `prisma/schema.prisma`. |
| **PWA** | “Add to Home Screen” so it feels like a phone app. `public/manifest.webmanifest`, `public/sw.js`. |

**How the screens are laid out (live on `main`):** shared buttons and cards live in `src/components/ui/`. Each main screen (My pick, Selections, Scores, Leaderboard, Standings) lives in `src/components/features/`. Server actions (submit a pick, issue an invite token) live in `src/app/actions/`. Pages under `src/app/` stay thin — they load data and render those feature screens. Quick file map for targeted fixes: [docs/FILE-MAP.md](FILE-MAP.md).

**Invite / API tokens (Phase 5, live under `src/lib/`):** hashed one-time invite tokens (`invite-token.ts`, `invite-token-db.ts`, `invite-token-schema.ts`), personal Join links (`invite-link.ts` — Admin still copies `?who=` / `?seat=`), signed API/cron tokens (`api-token.ts`), HMAC helpers using `AUTH_SECRET` (`token-crypto.ts`). Do not invent extra token screens or env vars. Admin **Personal Join links** have not switched to the hashed `?t=` token yet.

**CRITICAL — production data:** A Vercel Production build is `npm run build` → `next build` only. It does **not** run `ensure-production-db`, `prisma db push`, or seeds. Scheduled crons (missing-pick reminders, ensure-week) do **not** wipe or reseed the pool. Never reattach those scripts to the build. See [DEPLOY.md](../DEPLOY.md) section 4.

Local laptop work can use any Postgres URL. **Production always uses Neon**, not a file on someone’s computer.

Bottom nav: **My pick** · **Selections** · **Leaderboard** · **Scores** · **Schedule** · **Standings**. Header **Share** (current page URL) + **?** (Help) + **Account**. Share is hidden on Admin and Settings. Administrators also see **Admin**. What those screens do (and why Selections is `/pool`, Leaderboard is `/standings`, Standings is `/nfl`): [`docs/HOW-SCREENS-WORK.md`](HOW-SCREENS-WORK.md). File paths stay in [docs/FILE-MAP.md](FILE-MAP.md).

---

## 4. Secrets on Vercel (env vars)

**Env vars** = private settings Vercel injects at build/run time. They are **not** in GitHub.

Open: [vercel.com](https://vercel.com) → team **nfl-pool** → project **survive-sunday** → **Settings → Environment Variables**.

### Required for the live site

| Name | What to put | If missing or wrong |
|------|-------------|---------------------|
| `AUTH_SECRET` | Long random string (Vercel can generate one, or a trusted person runs `openssl rand -base64 32`) | Every `/api/auth/*` route 500s (`MissingSecret`). Demo login lands on `?error=NoSession`. |
| `AUTH_TRUST_HOST` | `true` | Auth.js may ignore the real site address. |
| `DATABASE_URL` | Set automatically by the **Neon** Vercel integration. Do not type it into the repo. | Login / join / picks fail. Often shows as `CallbackRouteError`. |
| `AUTH_URL` | Prefer **leaving this unset** on Vercel. If you set it, it **must** be `https://survive-sunday.vercel.app` | Leftover `https://example.com` or localhost pins Auth.js to the wrong host. The app **ignores** those leftovers at runtime so Host + `AUTH_TRUST_HOST` win. Still **delete** a placeholder so Auth.js is not pinned at build time. |
| `NEXT_PUBLIC_APP_URL` | `https://survive-sunday.vercel.app` | Public links / app URL can be wrong. |

### Optional (not required for demo)

| Name | What it does |
|------|----------------|
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google login exists in the server config but is **hidden on Sign in** (it was flaky). Demo picker works without these. |

Live scores and injuries use **ESPN public JSON** — no Vercel key. See [DEPLOY.md](../DEPLOY.md).

### Required for Forgot password (two keys)

Forgot password is **on `main`** (merged [PR #7](https://github.com/triwithms/survive-sunday/pull/7)). Production already has both keys (see **Notification ops** below). Friends will not receive a reset email if those keys are missing or the From address is unverified.

| Name | What to put | If missing |
|------|-------------|------------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free) | Forgot password says we couldn’t send a code. |
| `RESEND_FROM_EMAIL` | A From address Resend has **verified**, e.g. `Survive Sunday <noreply@yourdomain.com>` | Emails fail. `onboarding@resend.dev` only delivers to *your* Resend login email, not friends. |

**Click-by-click (you do this; a chat cannot):**

1. Open [resend.com](https://resend.com) and sign up (free).
2. Click **Domains → Add domain**. Use a domain you own. Copy the DNS records Resend shows into your domain host. Wait until Resend says **Verified**.
3. Click **API Keys → Create**. Copy the key once (it starts with `re_`).
4. Open [vercel.com](https://vercel.com) → team **nfl-pool** → project **survive-sunday** → **Settings → Environment Variables**.
5. Add `RESEND_API_KEY` = that `re_…` key. Environment: **Production**.
6. Add `RESEND_FROM_EMAIL` = a From address on the verified domain, e.g. `Survive Sunday <noreply@yourdomain.com>`. Environment: **Production**.
7. Vercel → **Deployments** → ⋮ on the latest Production row → **Redeploy**. Do not tick “use existing build cache.”
8. On the live site: **Sign in → Forgot password?** → enter your real email. You should get a 6-digit code (check inbox and spam/junk). If the page says we couldn’t send a code, the keys are still missing or the From address is not verified.

Same steps are in [DEPLOY.md](../DEPLOY.md) section **3b**. `onboarding@resend.dev` only delivers to *your* Resend login email, not friends — do not use it for the group.

**Do not send `SUNDAY26` to the group until step 8 works.**

### Optional (texts)

| Name | What it does |
|------|----------------|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Text the code to a friend’s cell. Spell these names exactly. Skip if email is enough today. See **Notification ops** below. |

Friends add their cell for SMS reminders on the first-run prompt, or later from Account. Missing-pick reminder **emails** (and texts if Twilio is set) go out only when that friend left **Missing pick reminder** on. The same Resend keys as Forgot password send the emails. A daily Vercel cron plus **Admin → Nudge missing picks** can fire them in the 24 hours before lock.

### Notification ops (production)

Standing facts for a CoS / free AI. Do **not** invent extra env values or flip modes. Account **Notification preferences** (Email / SMS / both / none) and Admin **Send test to me** are shipped ([#133](https://github.com/triwithms/survive-sunday/pull/133)). Click-by-click Resend setup stays in [DEPLOY.md](../DEPLOY.md) §3b — this is not a second deploy guide.

- **Resend:** Domain **triwithms.com** is **verified**. Production `RESEND_FROM_EMAIL` is `Survive Sunday <noreply@triwithms.com>`. New-domain mail may land in **spam** — friends should check junk.
- **`NOTIFY_MODE`:** Production uses **`allowlist`**. **`NOTIFY_ALLOWLIST`** is working. **Keep allowlist** until Robert explicitly says switch to **`live`**. Do not document as live-to-everyone yet. Password-reset and sign-in codes ignore this gate (SECURITY).
- **Twilio:** Spell the names **`TWILIO_ACCOUNT_SID`**, **`TWILIO_AUTH_TOKEN`**, **`TWILIO_FROM_NUMBER`**. SMS works for Robert’s **CA** cell. Trial messages carry a trial prefix. TwiML noreply bin is set.
- **US friends** (e.g. Pauli / Paul NJ, Go Giants / Carson CO): prefer **Email** until Twilio is upgraded / 10DLC or Verified Caller IDs cover them — SMS may fail or be unreliable for US numbers on trial.
- **Admin CC on player notices:** **Not building.** Password-reset Administrator alert is already shipped (leave it).

A full list with local-dev notes is in [`.env.example`](../.env.example) and [`DEPLOY.md`](../DEPLOY.md).

**After you change any env var:** Vercel → **Deployments** → ⋮ on the latest Production deploy → **Redeploy** (do not check “use existing build cache” if login is still broken).

---

## 5. How to deploy (put a fix live)

Normal path — no extra buttons:

1. A change is merged into the **`main`** branch on GitHub.
2. Vercel starts a **Production** deploy by itself.
3. Wait until that deploy is **Ready**.
4. Open [survive-sunday.vercel.app](https://survive-sunday.vercel.app) and try the flow that was broken.

That Production deploy compiles the site (`next build`). It does **not** change the Neon database (no db push, no seed, no `ensure-production-db`).

**If you only changed env vars** (no code): Redeploy as in section 4.

### How you merge a pull request (you do this; a chat does not)

1. Open the PR link (section 10).
2. Read the title. Confirm it is the change you asked for.
3. If GitHub says the branch has **conflicts** or is **out of date** with `main`, do **not** mash Merge. Open a **new** free Grok chat, paste prompt **(g)** in section 12, and give it that PR number so it can continue **that** branch.
4. When GitHub shows it can merge and you are happy: **Merge pull request**. Squash is fine (that is how Real mode landed).
5. Wait for Vercel Production to go **Ready**.

**First-time / empty database:** the live Neon database already has the BM Boys pool (`SUNDAY26`). A Vercel Production build is `next build` only — it does **not** push schema or seed. Redeploy will **not** create seats, rewrite names, or import Week 1 picks. If a brand-new empty database ever needed setup, that is an **intentional one-off** (see [DEPLOY.md](../DEPLOY.md) section 4), not a Redeploy. Do **not** re-run seed against the live pool.

A Redeploy also does **not** patch leftover short names or emails. Edit names on **Admin → Roster**. **Go Giants**, **Pauli**, and **JaJa** are already on the live roster (see section 6). Leftover `@pending.survivesunday.local` placeholders are treated as unclaimed practice seats (same as `@survivesunday.demo`) so they can Join; Gams stays claimed. If a leftover short name still shows, fix it on Roster — do not ask a chat to re-seed Production.

---

## 6. BM Boys roster (confirmed real names)

Nicknames stay as friends know them. Real names show in brackets on the board and on Join. Live late 13 Sep 2026: **13 player seats**.

| Nickname | Real name | On live Join |
|----------|-----------|--------------|
| Black Cobra | Justin John | Unclaimed |
| Cannoli Stuffer | Michael Frigo | **Claimed** (codes failing — temp password already set; see Admin → Roster for his email) |
| Colin | Colin Malone | Unclaimed |
| Daddy Chill | Joachim Kuzel | Unclaimed |
| Deep and Delicious | Kent Richmond | Unclaimed |
| Gams | Robert Gama | Claimed |
| Gdogss | Tony Gyuro | Unclaimed |
| **Go Giants** | **Carson Gama** | Unclaimed |
| JimmyC | Jim Coulson | Unclaimed |
| Long Snapper | John Stilo | Unclaimed |
| **Pauli** | **Paul Gama** | Unclaimed |
| **JaJa** | **Jacquie Gama** | Unclaimed (Join-claimable) |
| Steve | Steve Venerus | Unclaimed |

**Go Giants**, **Pauli**, and **JaJa** were added on the live roster (not only in seed files). Pauli’s nickname is **Pauli**, not Paul. Leftover `@pending.survivesunday.local` placeholders are treated as unclaimed practice seats (same as `@survivesunday.demo`) so they can Join; Gams stays claimed. JaJa uses `jaja@survivesunday.demo` so Join does **not** say already claimed. You can edit any row on **Admin → Roster**. A Redeploy does **not** patch names or create missing seats — use Roster (and **Admin → Import week picks** for a wrong Week 1 team).

---

## 6b. Official REAL Week 1 picks (already on the live board)

Week 1 picks for the BM Boys (including **Go Giants**, **Pauli**, and **JaJa**) are **already imported on production**. Friends see them on the Board after lock. Do **not** tell a chat the board still has demo sample rows (SF / CAR / TB / IND / DET / HOU / NYJ / ATL / KC for the wrong people). Do **not** use `public/examples/week1-picks-import.csv` or `data/week1-picks-status.md` — those are leftover demo / partial files.

Confirmed official teams for the original 10 (use this if you ever need to **re-import** week **1**):

```
nickname,team
Black Cobra,LAC
Cannoli Stuffer,LAC
Colin,LAC
Daddy Chill,SEA
Deep and Delicious,JAX
Gams,KC
Gdogss,LAC
JimmyC,JAX
Long Snapper,JAX
Steve,DET
JaJa,DAL
```

**Go Giants** (Carson Gama), **Pauli** (Paul Gama), and **JaJa** (Jacquie Gama) also have Week 1 picks on the live Board (JaJa = **DAL**, not Gams’ KC). If a row looks wrong, fix it with **Admin → Import week picks** (week **1**) — read the live Board, do not invent a team. Playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md).

---

## 7. How friends use it

The pool is **live-only**. The Demo vs Real toggle is gone (no practice picker). Full playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md).

Cold open (`/`) goes to **Sign in**. Join is via a personal or invite link (`/join?who=` / `/login?invite=`). After Sign in, default landing is **My pick**. **Selections** is `/pool` (group weekly picks). Friends never see a `demo1234` practice picker. The pool sits on **Week 2** for the group board. Header **Week N** is that pool week from the slate (read-only; not a friend’s personal next-pick week). **My pick, Selections, Scores, and Schedule** open on that friend’s current pick week (which can still be Week 1 until their game starts). Selections and Scores will **not** open a future week — future weeks stay on **Schedule**, which still lets you browse every week. Once a friend’s Week 1 game has started (or they never had a Week 1 pick path), **their** Week 2 picks open immediately — do not wait for Monday Night Football.

Unclaimed seats still use practice `@survivesunday.demo` emails so Join can claim that nickname. That is seat claiming, not Demo mode. Do not seed Production.

### Real login / join

- **Sign in** (`/login`): **email + password + Sign in**, plus a **Forgot password?** link. Safari still POSTs `/api/login`. Google is not on this screen (it was flaky). This is **not** a code at every login. Stay signed in on this phone.
- **Join** (`/join`): personal link from Admin (`/join?who=` / `?seat=`), or hashed invite sign-in (`/login?invite=` — email + nickname only). Then your own email and password (min 6 characters). That claims the existing seat so Week 1 picks stay. Invite code **`SUNDAY26`** is filled in. If the seat already has a real email, the page says it is claimed and links to Sign in. Practice `@survivesunday.demo` seats (and leftover `@pending.survivesunday.local` placeholders) are claimable. **One user, more than one role** (merged [PR #19](https://github.com/triwithms/survive-sunday/pull/19)): there is **no special admin account**. The same email can be **Player + Administrator**. Switch **Playing as …** / **Admin tools** from **Account** (top right) — not on League or other main screens. Administrator email can claim a player seat (Gams). People not on the list can still join as a new player.
- **Forgot password?** is the small link on Sign in: we email a 6-digit code (and text it if a cell is saved). Check inbox and spam/junk (new-domain mail may land there). Then new password → signed back in. Administrators get a notify that someone asked (no code in that email). Only after that friend has Joined with that email. This is **not** a code at every login. Production Resend is set — **section 4** notification ops.
- **Sign out:** header **Account** (top right) opens **Settings** (`/account`) → **Sign out** (merged [PR #18](https://github.com/triwithms/survive-sunday/pull/18)). Also on Admin and Help.
- **Notification preferences:** header **Account** → **Settings → Notification preferences**. Each friend chooses **Email / SMS / both / none** (`notifyPref`). Admin **Send test to me** on System. `NOTIFY_MODE` is `dryrun` | `allowlist` | `live`. Production is **allowlist**; **keep allowlist** until Robert says **`live`**. Password-reset codes always send when requested (SECURITY ignores prefs).
- **Pick backup:** header **Account** → **Settings → Pick backup**. Off, copy from a member (30 min), or auto best remaining **2025 rank** team (~2 min). Administrators can set the same on **Admin → Roster**. JaJa copies Gams by default.

The **Forgot password?** screen is on `main` (merged PR #7). Production Resend is set (**section 4** notification ops; click-by-click remains in [DEPLOY.md](../DEPLOY.md) §3b). Optional Twilio for texts (Robert’s **CA** cell works; prefer **Email** for US friends on trial). Check spam/junk. Practice `@survivesunday.demo` seats are Join placeholders, not a Demo-mode login.

### Picks

1. Bottom nav → **My pick**.
2. Tap a team that is playing this week and not already used.
3. Confirm. You can change that pick until **your team’s kickoff**, as long as the new game has not started either. **When that game starts, next week opens for you right away.**

On `main`, Pick opens on **your** open week (Week 1 while your game is still upcoming; Week 2 as soon as that pick is locked, or if you never had a Week 1 pick path). The header **Week N** badge is the **pool** week from the slate (read-only), not your personal next-pick week ([#122](https://github.com/triwithms/survive-sunday/pull/122)). Previous/next week arrows on the Pick header shipped with [PR #14](https://github.com/triwithms/survive-sunday/pull/14).

Team logos and names on the pick slate open a **team research** page (roster, news, record). On **My pick**, gold **Details ›** on a team opens that week’s game sheet (same UI as Scores). Close lands you back on My pick still deciding. **Pick** stays the primary action — tapping the row does not open Details. Tap an NFL **player name** there for college, depth role, and any matching ESPN injury note. Spreads on Pick / Schedule / confirm / team This week / Selections are **informational ESPN lines** in plain language when we have them (for example “BUF favoured by 4.5”; a pick'em is “Even (pick'em)”). Those lists do **not** show TV channel or quarter / down-distance (that stays on **Scores**). If ESPN has no line, that field is hidden — we never invent a fake **-3** for every team.

### Lock

- First kickoff is when everyone’s picks **reveal** on Selections (unless the administrator overrides it). There is **no** header countdown or “Deadline passed” banner. On **My pick**, you can change until **your game starts**; then that pick is locked and **the next week opens for you** — **not** after Monday Night Football. New joiners who never had a Week 1 pick path see **Week 2 is open — make your pick**.
- Before lock: only **your** pick is visible.
- After lock: everyone’s picks show; missed picks are applied once; finals are graded.
- After first kickoff, a player who already picked may still switch to another **not-started** game if their current pick’s game has also **not started**. Once that game starts, the pick locks and the next week opens for them. A missed first pick at lock stays a miss.

### Scores & injuries (live on `main`)

- **Scores** opens on the signed-in friend’s **current pick week** (same week Pick is focused on). Past weeks are fine; **future weeks stay on Schedule** — Scores will not open them.
- **Scores** (and My pick / Selections / Schedule) refresh from ESPN while games are on. Finals auto-grade.
- **Scores**, **My pick**, **Selections**, and **Standings** show **local-only** transparent helmets (`public/helmets/{abbr}.png` — no white plates, no ESPN CDN / `Team.logoUrl`; [#119](https://github.com/triwithms/survive-sunday/pull/119), [#124](https://github.com/triwithms/survive-sunday/pull/124)). Marks are sized to read at a glance on a phone. Possession is a **🏈** plus a gold bar.
- **Team pages** show ESPN’s public injury report as a **name list** (not official NFL). Selections / Scores / Schedule / Pick do not show Out / Doubtful / Q chips or TV stations. Tap a **player name** on the roster or injury list for a detail page.
- If ESPN is blocked or down, last saved scores stay; injury cards say the feed failed and link out.
- **Static cache (slice 1):** week slate / kickoffs last-good **6h** (20s while games are live or in the kickoff window); Scores/Schedule do not refetch ESPN on every tap inside TTL. Injuries last-good **24h** — UI keeps the last good list while a refresh runs and only replaces it when the content hash changes. Live scores and picks stay live.
- `data/sample_injury_news.json` is schema-only and is **not** shown in the UI on `main`.

### Standings / in vs out

- **Leaderboard** (`/standings`): still in → out, then fewest losses / most weeks survived; among equals clean record → live win margin of finished picks → nickname. Season-end tiebreak starts **collapsed** until tapped ([#118](https://github.com/triwithms/survive-sunday/pull/118)). Scores **Participants’ picks** / `GET /api/picks`: undefeated → one-loss → eliminated, then same pick / same game / nickname A–Z. **Selections** (`/pool`) is the weekly pick list (same team, then A–Z) — not the in/out race.
- You can open My pick, Selections, Scores, Standings, Leaderboard, Help, and team pages **without** making a pick. If lock hits and a player still has no pick, the app records a **missed pick** (loss / mulligan), except a spectator administrator. Players see a gold banner when the administrator has turned the mulligan off: **From Week X: no mulligan / one-and-done.**

### Scores, League, team pages

- Tap a team from My pick, Schedule, Standings, Scores, or Selections to open **team research** (`/team/KC`).
- **Scores** pulls the ESPN scoreboard, shows live / scheduled / final, and auto-grades games that are final.
- **Share as a picture** (merged [PR #45](https://github.com/triwithms/survive-sunday/pull/45)): header **Share** sends the page link. Picture share has no extra button on the Leaderboard/Scores screen — **press and hold the title** or **triple-tap the week label**. Full long screenshot is always a choice. Shorter options plus split pages when the page is very long. Nav, bottom tabs, **Details ›**, and “tap for details” stay off the image. Help → **Share Leaderboard & Scores as a picture**. Does **not** change picks, Join, Sign in, or lock. Scores cards themselves still show **Details ›** on the live page ([#46](https://github.com/triwithms/survive-sunday/pull/46)).
- **Standings** and **Schedule** are research screens (NFL W-L / full slate). In Real mode, Standings **W-L syncs from ESPN** (not the demo `week2-standings.json` seed, and no player-facing “demo” League copy). Kickoff times in the app are the **US slate** (ET + US networks such as CBS / Fox / NBC).
- **Team pages** (`/team/KC` and so on): helmet, record, this week’s game, **style** (above coach), **head coach** (ESPN name + ESPN / Wikipedia / team links), then links for **Offence / Defence / Special teams** (starters-only checkbox; healthy starters first, then injured starters — [#121](https://github.com/triwithms/survive-sunday/pull/121)), **Injuries** (ESPN public report, not official NFL), and **News**. No Key players card. No full roster dump. Tap a **player name** for number, position, college, starter vs depth, and any matching ESPN injury note. Full-season team schedule is **not** on `main` yet (open [PR #132](https://github.com/triwithms/survive-sunday/pull/132) — **HOLD**).
- These are **NFL roster players**, not pool members (nicknames on Selections / Leaderboard).

### Canadian TV (when you share a schedule — not in the app)

The app does **not** list Canadian channels. When you text or email friends a slate (or later Wave 2 digests), add **Canadian** times and channels yourself: **TSN**, **CTV**, **RDS**, **DAZN** (plus kickoff in local time). Do not ask a chat to invent a live Canadian-listings feed.

### Phone / Home Screen (PWA)

After Sign in on a **phone browser**, a card asks: **Do you want to add NFL Pool to your Home Screen?** **Yes** / **No** / **Not now**. Not now asks again next Sign in. No stops auto-prompts; Help → **Install on Home Screen** (top of Help) shows the Yes steps. If they already open the **Home Screen icon**, we mark installed and do not nag. If they delete the icon and open in Safari, we ask again. Desktop never shows.

- **iPhone:** Safari only (not Chrome, not in-app browsers). **…** beside the URL → scroll down → **Share** (arrow up) → **Add to Home Screen** → **Add** (name can stay **NFL Pool**). Then close Safari and open only from the Home Screen icon. If Add to Home Screen is missing: bottom of Share list → **Edit Actions** → enable it → try again.
- **Android:** Chrome menu → Install app / Add to Home screen. If Chrome offers Install, they can tap it.
- **Computer:** any modern browser. Bookmark if you like.

**A2HS iOS steps** must be re-checked against current Safari UI after major iOS updates (… beside URL → scroll → Share → Add to Home Screen; Safari-only; close Safari after add).

Stay-logged-in is about **90 days** on this phone/browser (opening the app keeps it fresh). Clearing site data or signing out logs them out. Sign in once inside the Home Screen app if the icon opens logged-out.

In-app **Help → Getting started** has the same iPhone / Android steps plus Join-link and Sign-in-code click-by-click. Update that Help whenever those processes change.

Hold the **group invite** until Forgot password actually delivers a code (check spam/junk). Then send **personal Join links** (Admin), not one blast to the whole chat. Install steps themselves are ready.

---

## 8. Admin

**Admin** is in the bottom bar for administrators (also under **Account**). Three phone tabs: **Users · Pool · System**. `/admin` opens Users. There is no Demo vs Real toggle — the pool is live-only (Week 2 current).

Gams is Player + Administrator. Switch **Playing as Gams** / **Admin tools** from **Account**. Full playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md).

| Tool | What it does |
|------|----------------|
| **Live-only pool** | Demo vs Real toggle was removed. The pool is forced live without wiping picks. Open seats still claim via `@survivesunday.demo` Join emails. |
| **Reset pool** | Admin → **System** → **Danger — reset the pool** (closed until you open it). Optional. Clears picks, removes practice accounts (`@survivesunday.demo`), resets everyone to undefeated. Type `RESET` to confirm. Does **not** wipe Auth/env. **Do not reset now** — Week 1 imports and the live roster (including JaJa) are already live. **Shipped.** |
| **Add user** | Admin → **Users**. Fill any of nickname / full name / cell / email / password. Or send a Join invite + temp password. `/welcome` can fill gaps later. Existing Prisma fields only. |
| **Personal Join links** | On that friend’s Users row (**Invite** / **Copy Join**). One URL per open seat. Send that link only to that friend. |
| **Roster** | See each nickname + real name (including Go Giants, Pauli, JaJa). Edit nickname, full name, email, cell. Copy that person’s Join link if they have not Joined yet. Set **If no pick within 30 min, copy from** (JaJa → Gams). Audit-logged. |
| **Enter a friend’s pick** | System tab. Current or past weeks. Next week only after that friend’s own game has started and they have a valid pick. No far-future weeks. |
| **Pool rules — mulligan** | Turn off the free mulligan from a chosen week (or immediately). One loss = out from that week. Already-scored weeks stay as they are. People who already used a mulligan stay in with one loss. Players see a banner. You can turn the mulligan back on. |
| **Hand the pool to someone else** | Admin → **Pool**. Transfer Admin to another **existing** member. Type their nickname and confirm. You stay as a player and lose Admin. They keep their picks and stay on the board. Different from **Make administrator** (that keeps both of you as Admin). The app will not transfer if nobody else is in the pool. |
| **Set a temporary password** | Admin → **Users** → find the friend → Edit → save a password → **copy the text**. Audit-logged (password not stored in the log). If they have not Joined, send their personal Join link instead. **Shipped.** |
| Remove player | Inside that person’s Users editor. |
| **Administrators** | Admin → **Pool** → **Make administrator**. Grant Admin tools to an existing pool player (confirm). They stay on the board. Same login can be Player + Administrator; switch views. Remove Admin is allowed only if another administrator remains. **Shipped** ([PR #19](https://github.com/triwithms/survive-sunday/pull/19)). |
| **Share Leaderboard / Scores** | Header Share (page link) is hidden on Admin. Picture share: press and hold the Leaderboard or Scores title, or triple-tap the week label. No extra Share button on those screens. Full long picture always, or a shorter / split option. **Shipped** ([PR #45](https://github.com/triwithms/survive-sunday/pull/45)). |

Removed from Admin UI (do not put back): Comms tab, pick census, unlock testing, lock controls, score & grading, Your administrator login.

### Admin Users UX

Admin → **Users** is a phone-first roster (~390px): **Add user**, **Find a friend**, then one compact row (nickname + Joined / Unclaimed). Tap Edit to open that friend only — opening another closes the first. Unclaimed rows have **Invite** and **Copy Join** (44px; toast on copy). Joined friends get the password form inside Edit (suggest + copy-ready text; we do not email the password). Admin can change email and cell, but not to a value another pool member already uses (“That email is already used” / “That cell is already used.”). Remove stays inside that person. **Make administrator** and **Hand the pool** live on **Pool**. No player Who-are-you list on Admin. No Commissioner person.

---

## 9. Product priorities — MUST vs BONUS vs not yet shipped

Labelled so a basic Grok chat does **not** wander into extras. **MUST** means keep it working or finish it if asked. **BONUS** means do not start unless you ask. **Not yet shipped** means the work may exist as an open PR, but friends do **not** have it on the live site.

### MUST (keep working; fix first)

| Priority | Status on `main` today |
|----------|------------------------|
| ~100% reliable core: submit pick, group board, in vs out | **Built.** Protect this above all else. |
| Administrator can change a participant pick after the fact | **Built** via **Admin → Import week picks** (audit-logged). No single-player “edit pick” button yet. |
| Friends can use the app without picking every week | **Built.** They can browse without picking. A missed week still counts as a loss after lock. Changing that rule is a product decision — say so explicitly. |
| Transfer ownership (hand Admin to another friend) | **Shipped.** Admin → **Hand the pool to someone else**. They keep playing; you stay as a player and lose Admin. Different from **Make administrator**. |
| Turn off the free mulligan (one-and-done from a week) | **Shipped.** Admin → **Pool rules — mulligan**. Already-scored weeks stay. Players see a gold banner. |
| No “demo” labels / `demo1234` practice picker | **Shipped.** Pool is live-only (Demo vs Real toggle removed). Week 2 current. Playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md). |
| Friends claim a seat via Join / invite link | **Shipped** (merged [PR #19](https://github.com/triwithms/survive-sunday/pull/19)). Cold open is Sign in; Join via personal/invite link (`/join?who=` / `/login?invite=`). Claiming attaches email/password to the existing seat. Already-claimed seats say Sign in instead. Same email can be **Player + Administrator**; switch from **Account** with **Playing as …** / **Admin tools**. Admin can promote another existing member. Administrators copy **personal Join links** from Admin / Roster. |
| Simple password reset (code by email or SMS) | **Merged / shipping** ([PR #7](https://github.com/triwithms/survive-sunday/pull/7)). Sign in is **email + password**; **Forgot password?** → 6-digit code is on `main`. Production Resend is set (**section 4**). Check spam/junk. Optional Twilio for texts. |
| Add to Home Screen + stay logged in on phone; also mobile web + desktop | **Built.** After Sign in on a phone, Yes / No / Not now. Yes = Install or iOS … → scroll → Share → Add to Home Screen. Not now = next Sign in. No = Help → Install on Home Screen. Home Screen icon does not nag. Cookie is ~**90 days**. |
| Each friend chooses Email / SMS / both / none | **Shipped** ([#133](https://github.com/triwithms/survive-sunday/pull/133)). Account → **Notification preferences** (`User.notifyPref`). Admin **Send test to me**. `NOTIFY_MODE` is `dryrun` \| `allowlist` \| `live`. Production is **allowlist**; **keep allowlist** until Robert says **`live`**. Password reset is never gated. |

### Do not build (already decided)

- **A code after every sign-in (2FA).** Closed [PR #5](https://github.com/triwithms/survive-sunday/pull/5). That would block “tap the Home Screen icon and you’re in.” Password-reset and optional sign-in codes are only when the friend asks, not every login.
- **Admin CC on player notices.** Not building. Password-reset Administrator alert is already shipped.

### BONUS (do not start unless you ask)

- **Live odds-based favourite strength meter** on the pick screen until kickoff. Today the pick screen shows a **static** spread from seeded data, not a live meter.

Live **scores** and **injury report** (ESPN public JSON) are already wired on `main` — not a bonus. **Weekly videos + game highlights** are shipped (Scores / Schedule → **Details**, leftover `/videos` deep link) — do not rebuild them. Videos are **not** a bottom tab or header item.

### Later / Wave 2 (do not confuse with MUST)

Lowest priority. Do **not** start unless the owner asks. None of this is on `main`.

- H2H gloves animation, banter, weekly SMS/email **digests**, WhatsApp, extra visual polish. **Notification type preferences are shipped** (not this list). If digests ever happen, include Canadian TV (TSN / CTV / RDS / DAZN) in the copy — that is not an app feature today.

---

## 10. Shipped vs still open (19 September 2026)

Re-checked against GitHub `main` and the live site. **Do not describe an open PR as live.** After you merge one, update this file in the same PR.

### Already on `main` (done — do not re-open)

| Work | PR | What friends have today |
|------|-----|-------------------------|
| Login / session cookie + AUTH_URL placeholder guard | several early merges | Sign-in keeps a session when env vars are set. |
| BM Boys real names + Roster editor | [#9](https://github.com/triwithms/survive-sunday/pull/9) | John Stilo / Steve Venerus / Tony Gyuro, plus Admin → Roster. Live roster also has **Go Giants** (Carson Gama) and **Pauli** (Paul Gama). |
| Owner handoff (earlier passes) | [#13](https://github.com/triwithms/survive-sunday/pull/13), [#15](https://github.com/triwithms/survive-sunday/pull/15) | **Superseded by this file.** |
| Live ESPN scores + injury report | [#12](https://github.com/triwithms/survive-sunday/pull/12) | Scores poll ESPN; team pages + chips use ESPN injuries. No paid key. |
| Live pool (was Real vs Demo), reset, real administrator login | [#10](https://github.com/triwithms/survive-sunday/pull/10); toggle removed on Admin tabs PR | Live-only. **Week 2** is the current board week (header **Week N** from the slate). No practice picker. [`docs/REAL-MODE.md`](./REAL-MODE.md). |
| Forgot password + ~90 day stay-logged-in | [#7](https://github.com/triwithms/survive-sunday/pull/7) (squash-merged, `2df4645`) | Sign in → **Forgot password?** → 6-digit code → new password. **Merged / shipping.** Production Resend is set (**section 4**). Check spam/junk. Optional Twilio. |
| Pick header previous / next week | [#14](https://github.com/triwithms/survive-sunday/pull/14) | Chevrons around the gold `W#` badge; `?week=` like Home / Scores. Past / future weeks read-only. |
| Safari sign-in + Account Sign out | [#18](https://github.com/triwithms/survive-sunday/pull/18) | Login errors show on the page. Header **Account → Sign out**. |
| Seat claim + Player/Admin roles | [#19](https://github.com/triwithms/survive-sunday/pull/19) | Join via personal/invite link. Cold open is Sign in (no Home **Who are you?** list). **One user, multiple roles** — not a separate admin account. **Playing as … / Admin tools** lives in **Account**, not on League / main screens. Promote another member. |
| Week 2 schedule in Real/live | [#22](https://github.com/triwithms/survive-sunday/pull/22) | Week 2 is a real NFL week on Schedule / Pick. Demo isolation does **not** hide the slate. |
| Survival board / pick-list sort | this PR (after [#21](https://github.com/triwithms/survive-sunday/pull/21), [#24](https://github.com/triwithms/survive-sunday/pull/24), [#38](https://github.com/triwithms/survive-sunday/pull/38)) | Undefeated → one-loss → eliminated, then same pick → same game → nickname A–Z. Pick-first (and weeks-survived) was wrong for these lists. |
| League W-L from ESPN (no demo leak) | live-standings merge (`538be1f`) | Real-mode League syncs ESPN W-L. Demo `week2-standings` seed is not shown to Real-mode friends. |
| Pick-change until kickoff | [#25](https://github.com/triwithms/survive-sunday/pull/25) | Every week: change an existing pick until **that team’s** kickoff if the new game has not started. |
| Next-week picks unlock per player | [#50](https://github.com/triwithms/survive-sunday/pull/50) | Once **your** current-week game has started (pick locked), **next week’s picks open for you immediately**. Do **not** wait for Monday Night Football. New joiners who never had a Week 1 pick path see **Week 2 is open — make your pick**. Friends still waiting on their own Week 1 kickoff keep the Week 1 flow. |
| Notification preferences | [#29](https://github.com/triwithms/survive-sunday/pull/29) | Header → **Account → Notification preferences**. Types: missing pick, pick saved/changed, results, you’re out / mulligan, pool notes (default on); live scores, injury notes (default off). Email via Resend. Missing-pick SMS follows the same switch. If that page 500s, production is missing NotificationPreference columns — boot + request retry now add them. |
| JaJa seat + pick backup | [#37](https://github.com/triwithms/survive-sunday/pull/37) | **JaJa (Jacquie Gama)** is on Join as claimable, Week 1 **DAL**. Pick backup: off / copy-from-member (30 min, no 💩; JaJa → Gams later) / auto best remaining **2025 rank** team (~2 min, stamps 💩). Official winner must have no 💩. Help stays general (no JaJa / Gams copy example) — [#41](https://github.com/triwithms/survive-sunday/pull/41). |
| Unclaim leftover pending.local seats | [#27](https://github.com/triwithms/survive-sunday/pull/27) | **Go Giants** and **Pauli** are Join-claimable again if they still had leftover pending emails. |
| Cell-number first-run prompt | [#42](https://github.com/triwithms/survive-sunday/pull/42) | Soft ask to add a cell for SMS reminders; skippable. |
| Personal Join links + Home Screen prompt + simpler Sign in | [#44](https://github.com/triwithms/survive-sunday/pull/44) | One Copy per open seat (`?who=` when unique). Claimed seats → Sign in. Phone browser prompt after Join / first Sign in. Sign in defaults to **Email me a sign-in code**; password and Forgot are secondary; Google hidden on Sign in. Help + this file updated. |
| Scores Details › | [#46](https://github.com/triwithms/survive-sunday/pull/46) | Gold **Details ›** on live, Final, and upcoming game cards. Tap opens the game sheet. Logos still open team pages. |
| Share Board / Scores as pictures | [#45](https://github.com/triwithms/survive-sunday/pull/45) | Quiet gesture: **press and hold the title** or **triple-tap the week**. No Share button. Always includes the **full long picture**. Chrome (nav, tabs, Details ›) stays off the image. Help + this file. Does not touch picks / Join / Sign in / lock. |
| Administrator: turn off mulligan + transfer | [#8](https://github.com/triwithms/survive-sunday/pull/8) | **Pool rules — mulligan** (one-and-done from a chosen week; already-scored weeks stay). **Hand the pool to someone else** (existing member only; they keep picks; you stay as a player and lose Admin). Dual roles / Make administrator stay. |
| NFL player details | [#11](https://github.com/triwithms/survive-sunday/pull/11) | On a team page, tap a **key player** or roster name. Shows number, position, college, starter vs depth, and any matching ESPN injury note (same feed as the team injury card — not a sample file). |
| Head coach + team page order | [#20](https://github.com/triwithms/survive-sunday/pull/20) | **Coach** card (ESPN name + ESPN / Wikipedia / team links). Team info (record, this week, coach, style) sits at the top; **Key players** is further down. Tap a player still opens details. |
| Larger team logos (first bump) | [#43](https://github.com/triwithms/survive-sunday/pull/43) | ESPN marks beside abbreviations on Scores, Pick, Board, and League. Modest ~20–30% bump. |
| Larger team logos (second bump) | [#49](https://github.com/triwithms/survive-sunday/pull/49) | Clear step up on a phone: compact 32→44, row 36→48, slate 50→66, featured 64→84, hero 72→96. |
| Weekly videos + game highlights | [#51](https://github.com/triwithms/survive-sunday/pull/51) | Header **Videos** (and Home title cards). Scores → **Details** for that game’s highlights. |
| Videos: this season only | [#52](https://github.com/triwithms/survive-sunday/pull/52) | Weekly previews and game highlights are **2026/27 only**. Titles with older years, throwback / vault wording, or no this-season publish date are skipped. |
| Videos: Watch on YouTube (no in-app player) | [#53](https://github.com/triwithms/survive-sunday/pull/53), then this wrap-up | Thumbnail + title + **Watch on YouTube**. Never an in-app iframe (that was the “Video unavailable” + raw HTML). Same for previews and highlights. |
| Videos: previews until kickoff, then highlights | [#54](https://github.com/triwithms/survive-sunday/pull/54) | Game previews only before kickoff. After a game is live or Final, that game’s previews come down and highlights show. Fixes missing DEN @ KC (MNF) previews. |
| Scores: pick week + no future weeks | this wrap-up | Scores opens on **your** current pick week. You can look back. Future weeks stay on **Schedule**. |
| Schedule fake -3 odds | [#57](https://github.com/triwithms/survive-sunday/pull/57) | Stopped inventing home **-3** when a line was missing. |
| Schedule / Pick list: no TV or 2Q; real ESPN favourites | [#58](https://github.com/triwithms/survive-sunday/pull/58) | Schedule and Pick cards drop CBS/FOX/TSN and quarter / down-distance. Favourites come from the ESPN week scoreboard (for example BUF -4.5) when ESPN publishes a line. |
| Schedule / Pick: no injury Q chips; Pick shows favourite | [#59](https://github.com/triwithms/survive-sunday/pull/59) | Schedule and Pick lists no longer show Out / Doubtful / **Q** injury count chips. Pick shows the same favourite line as Schedule. Injuries stay on team pages. Scores live strip is unchanged. |
| Spread copy: favoured by N | this PR | Plain-language favourite: **BUF favoured by 4.5** (not Favourite: BUF -4.5 / Fav -4.5). Pick’em shows **Even (pick’em)**. Still hidden when ESPN has no line. |
| App Router layout (ui / features / actions) | Phase 1–4 on `main` ([#75](https://github.com/triwithms/survive-sunday/pull/75), [#74](https://github.com/triwithms/survive-sunday/pull/74)) | Shared UI in `src/components/ui/`. My pick / Selections / Scores / Leaderboard / Standings in `src/components/features/`. Server actions in `src/app/actions/`. Pages under `src/app/` stay thin. |
| Invite / API tokens | [#78](https://github.com/triwithms/survive-sunday/pull/78) | Modules under `src/lib/`: `invite-token.ts`, `invite-token-db.ts`, `invite-token-schema.ts`, `invite-link.ts`, `api-token.ts`, `token-crypto.ts`. Hashed invite `?t=` is wired on Join; Admin Personal Join links still copy `?who=` / `?seat=`. No extra token Admin tab. |
| Production build does not touch Neon | Safety P0 (`3820ba4`) | `npm run build` is `next build` only. `postinstall` is `prisma generate` only. Seed/setup/`db:push` refuse Production. Do **not** reattach `ensure-production-db` / db push / seed to the Vercel build. Crons do not wipe or reseed. |
| Help topic menu | [#108](https://github.com/triwithms/survive-sunday/pull/108) | `/help` is a short topic list. Tap a topic (or a hash) to see only that section + **Back to Help topics**. |
| Leaderboard tiebreak collapsed | [#118](https://github.com/triwithms/survive-sunday/pull/118) | Season-end tiebreak starts collapsed until tapped. |
| Local-only team logos | [#119](https://github.com/triwithms/survive-sunday/pull/119) | Helmets from `public/helmets/{abbr}.png`. No ESPN CDN marks in the UI. |
| Slate / injury last-good cache | [#120](https://github.com/triwithms/survive-sunday/pull/120) | Week slate 6h (20s while live); injuries 24h. Live scores and picks stay live. |
| Healthy-then-injured starters | [#121](https://github.com/triwithms/survive-sunday/pull/121) | Team unit pages list healthy starters first, then injured starters. |
| Header Week N = pool week | [#122](https://github.com/triwithms/survive-sunday/pull/122) | Header **Week N** is the pool week from the slate, not a friend’s personal next-pick week. |
| Transparent helmets (no white plates) | [#124](https://github.com/triwithms/survive-sunday/pull/124) | NE / CLE (and others) are transparent local PNGs — no leftover white plates. |
| Bottom nav IA | [#126](https://github.com/triwithms/survive-sunday/pull/126) | **My pick · Selections · Leaderboard · Scores · Schedule · Standings**; header **?** Help. Bottom nav stays on the viewport (iPhone Schedule). |
| NFL Pool Home Screen / browser icons | [#127](https://github.com/triwithms/survive-sunday/pull/127) | Football mark in `public/icons/`. Shortcut name **NFL Pool**. |
| YOU'RE OUT overlay | [#128](https://github.com/triwithms/survive-sunday/pull/128) | Eliminated players get a near-full overlay on My pick; no picks. Admin elimination alerts. |
| Invite sign-in prefill | [#130](https://github.com/triwithms/survive-sunday/pull/130) | `/login?invite=` peeks hashed token (email + nickname only). Partial Admin player profiles. |
| Account notifyPref + NOTIFY_MODE | [#133](https://github.com/triwithms/survive-sunday/pull/133) | Email / SMS / both / none on Account; Admin **Send test to me**; `NOTIFY_MODE` `dryrun` \| `allowlist` \| `live`. Production is **allowlist** — keep it until Robert says **`live`**. |
| Chief of Staff takeover doc | [#135](https://github.com/triwithms/survive-sunday/pull/135) | [`docs/CHIEF-OF-STAFF-TAKEOVER.md`](CHIEF-OF-STAFF-TAKEOVER.md) — crash-recovery playbook for a new CoS. |

### Open — not on `main` yet

| Work | PR | Notes |
|------|-----|-------|
| Team page full-season schedule | [#132](https://github.com/triwithms/survive-sunday/pull/132) | **HOLD** — not live. Do not document as shipped. Merge only when Robert says go. |

Closed and **not** merged: [PR #5](https://github.com/triwithms/survive-sunday/pull/5) (code after every sign-in). Do not rebuild it.

Open PRs sometimes add different database columns. Preview deploys share one Neon database, so one PR can break another’s preview. That is annoying but does **not** mean `main` is broken.

---

## 11. When something breaks

### How to read Vercel (no jargon)

1. Open Vercel → **nfl-pool** → **survive-sunday**.
2. **Deployments** = each build. Red = failed. **Ready** = live (for Production).
3. Click a failed deploy → **Building** log. A **type error** looks like `Type error:` and a file path (example that already happened: `src/lib/request-host.ts` `RequestInit` / `signal` mismatch).
4. For a **Ready** site that still misbehaves: open that deploy → **Logs** (or **Runtime Logs**). Search for `auth`, `Prisma`, `Neon`, `NoSession`, `CallbackRouteError`.

### Real incidents and the usual fix

These already happened. Use the same checklist before asking a chat to rewrite login.

**A. `NoSession` or “problem with the server configuration”**

Friends land on `/?error=NoSession`. `/api/auth/session` or `/api/auth/csrf` may 500.

1. Confirm `AUTH_SECRET` is set on **Production**.
2. Confirm `AUTH_TRUST_HOST=true`.
3. Check `AUTH_URL`. If it is `https://example.com` (or localhost), **delete it** or set it to `https://survive-sunday.vercel.app`. The app also ignores those leftover values at runtime.
4. Redeploy.

**Why this broke before:**

- Missing `AUTH_SECRET` → Auth.js cannot mint a session (`MissingSecret`).
- Custom cookie names fought Auth.js HTTPS defaults (`authjs.*` vs `__Secure-` / `__Host-`). The repo now uses Auth.js defaults: HTTP → `authjs.*`, HTTPS → `__Secure-` / `__Host-`.
- `/api/demo-enter` used a hand-built redirect that **dropped** the session cookie. It now uses `redirect()` from Next.js so the cookie is kept.

**B. `CallbackRouteError` (or “Configuration” on the login page)**

Auth.js is running, but the **database lookup** threw. Common causes:

- Neon / `DATABASE_URL` missing or not reachable.
- Schema never pushed / demo pool never seeded (`SUNDAY26` missing).
- Prisma query engine missing on Vercel (the repo already marks Prisma as a server package). A Production **build does not** push schema or seed.

Fix: confirm Vercel env `DATABASE_URL` (Neon integration). Redeploy compiles the site only — it will **not** run `prisma db push` or seed. If the database is empty or the schema was never applied, that is an **intentional one-off** (see [DEPLOY.md](../DEPLOY.md) section 4), not a Redeploy. Do not paste the URL into GitHub. Do not reattach `ensure-production-db` to the build.

The credentials lookup now **catches** database errors and returns a normal “wrong email/password” style failure instead of `CallbackRouteError` when it can.

**C. Build type errors**

The site does not go live. Open the deploy **Building** log, copy the `Type error:` block (not npm deprecation warnings), and give that to a **deploy** chat (prompt below).

**D. Demo login works locally but not on the phone**

Use the **same** link the friend opened (the vercel.app URL). Do not mix `localhost` and production. After env fixes, Redeploy, then hard-refresh or re-add to Home Screen.

**E. Board still shows demo sample picks (SF / CAR / TB / …)**

That was last afternoon’s leftover seed. **Official Week 1 rows are imported** (including JaJa → DAL). If a single name still looks wrong, **Admin → Import week picks** for week 1 (do not Reset the whole pool). Do not ask a chat to invent a live data feed to “fix” picks. Do not paste the demo example CSV.

---

## 12. Maintaining with free AI first (not paid Grok Bot)

**#1 cost rule:** For specs, FILE-MAP lookups, QA critic scoring, copy, and checklists, use free tiers in order — **free Grok, then free Claude, then free Gemini** — before any paid Grok Bot / Cursor coding agents. Paid agents only for the actual code PR/merge. Aim to save ~30–50% usage by keeping planning and critic loops off paid runs. Short brief: [`docs/FREE-GROK.md`](FREE-GROK.md).

**Docs freshness:** When any free or included usage allotment is near empty, refresh HANDOFF / FREE-GROK.md / FILE-MAP with shipped changes **before** starting more work — so the next session (next free tier, or next week’s included Grok Bot / Cursor usage) starts from current docs. Applies to free Grok → Claude → Gemini **and** to Grok Bot / Cursor included weekly usage. Help only if a user/admin process changed. Do not wait until quota is fully gone.

**HANDOFF / usage rule:** Do not rewrite this file or Help on every small PR. Update docs at most once per day or at the end of a batch. Coding agents: do not read the whole HANDOFF or `data/*.json` unless the owner says to. Touch only named files. Reply short: files touched, 5-line summary, how to verify. No Wave 2, no extra branches for docs.

### What basic Grok can vs cannot do well

**Good for**

- Explaining a Vercel / browser error in plain English (en-CA)
- Drafting a **small** code patch as “open this PR / change these files”
- Click-by-click Vercel and GitHub steps (env vars, Redeploy, Merge)
- Updating **this file** at most once a day when a batch ships (not each tiny fix)
- Reordering copy, Help text, or a CSV the owner will paste
- Diagnosing `AUTH_SECRET` / `AUTH_URL` / `AUTH_TRUST_HOST` / `NoSession` / `CallbackRouteError` from a **redacted** log snippet

**Weak / risky — do not pretend a basic chat can drive these alone**

- Multi-file refactors that touch Auth.js + Prisma + Neon together (needs a proper coding agent, or a human who can run the app)
- Merging **conflicting** PRs or resolving git conflicts across several branches
- Clicking Vercel / GitHub **for** the owner
- Inventing live data feeds, Canadian channel listings, or features as if they were already on `main`. Weekly videos already ship from official YouTube channels — do not add a second library.

**Rules for every chat**

1. Prefer **one small PR per chat**.
2. **Continue** an existing open PR branch. Never reopen password reset (merged PR #7), Real mode (merged PR #10), seat-claim / roles (merged PR #19), Safari/Sign out (merged PR #18), Week 2 slate restore (merged PR #22), board sort (merged PRs #21 / #24), pick-week nav (merged PR #14), Week 1 pick-change-until-kickoff (merged PR #25), mulligan/transfer (merged PR #8), player-detail pages (merged PR #11), or head-coach / team-page order (merged PR #20).
3. **Never invent features as “live.”** If it is not on `main` (section 10), say it is not shipped.
4. Owner is **not a coder** — every answer needs click-by-click GitHub / Vercel / Admin steps, not “run this locally.”
5. Do not use or recommend **paid Grok Bot**, Cursor desktop agents, or other expensive coding bots unless **free Grok**, then **free Claude**, then **free Gemini** are exhausted (or unsuitable) and the owner asks.

### Habit

1. Keep **this file** and GitHub `main` as the source of truth.
2. Open a **new Grok (or basic xAI) chat per topic** (saves usage). Do not reuse a long “everything” thread.
3. Paste the matching starter prompt + the relevant error text / screenshot (no secrets).
4. Ask for a **small pull request** only. **You** merge to `main` when you are happy; Vercel deploys.
5. **Update this file in the same PR** whenever something ships or you decide not to ship it.

### What to attach

- Link to this file: `docs/HANDOFF.md`
- The folder list in the prompt (already included)
- Vercel error text, not the whole log
- The open PR number if the work is already in progress (so the chat does not start a second copy)

### Starter prompts (copy-paste)

Replace the last sentence with your actual problem.

#### a) Login / auth / password reset

```
You are helping maintain Survive Sunday, a private NFL survivor pool PWA.
Read docs/HANDOFF.md first. Trust GitHub main for what is live.
You are free Grok or a basic paid Grok / xAI chat — not paid Grok Bot.
Then only these paths unless a listed open PR is the task:
- src/lib/auth.ts
- src/lib/credentials-user.ts
- src/lib/demo-session.ts
- src/lib/request-host.ts
- src/lib/otp.ts
- src/lib/otp-delivery.ts
- src/lib/password-reset.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/app/api/password/forgot/route.ts
- src/app/api/password/reset/route.ts
- src/app/api/demo-enter/route.ts
- src/lib/pool-mode.ts
- src/lib/pool-mode-db.ts
- src/app/login/page.tsx
- src/app/login/forgot/page.tsx
- src/components/ForgotPasswordForm.tsx
- src/app/join/page.tsx
- src/lib/claim-seat.ts
- src/lib/claim-seat-db.ts
- src/lib/membership-schema.ts
- src/instrumentation.ts
- src/lib/auth-credentials.ts
- src/lib/roles.ts
- src/lib/roles-db.ts
- src/app/api/join/route.ts
- src/app/api/join/seats/route.ts
- src/components/JoinForm.tsx
- src/components/WhoAreYouSelect.tsx
- src/components/WhoAreYouCard.tsx
- docs/REAL-MODE.md
- .env.example
- DEPLOY.md

Owner is not a coder. Explain steps in plain English (en-CA), click-by-click.
Make one small PR. Do not add Wave 2 extras or the live-odds bonus unless I ask. Weekly videos already ship — do not rebuild them.

Honest status:
- Login/session cookie + AUTH_SECRET / AUTH_TRUST_HOST / AUTH_URL pitfalls are already fixed on main.
- Do not rebuild every-login 2FA (closed PR #5).
- Password reset (email/SMS one-time code) is **on main** (merged PR #7). Do not start a second copy. Production Resend is set (HANDOFF section 4 notification ops). Check spam/junk. Do not invent extra env vars.
- Stay-logged-in on the phone is ~90 days on main.
- Seat claim + Player/Administrator roles + role switcher are **on main** (merged PR #19). Do not start a second copy.
- Safari sign-in + Account Sign out are **on main** (merged PR #18).
- Personal Join links and Home Screen prompt ship in the Join / Home Screen UX pack. The client A2HS card lives in `src/components/features/a2hs/`. Do not start a second copy. Sign in is email + password + Forgot password. Password form POST to `/api/login` must stay (Safari cookies).

My problem: [describe login / session / forgot-password issue]
```

#### b) Picks / lock / standings

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md first, then only:
- src/app/api/picks/route.ts
- src/app/(app)/pick/page.tsx
- src/app/(app)/pool/page.tsx
- src/app/(app)/standings/page.tsx
- src/components/PickClient.tsx
- src/lib/grading.ts
- src/lib/pool-mode.ts
- src/lib/week-isolation.ts

You are free / basic Grok chat — not Grok Bot. One small PR. Continue existing branches.

Core MUST: submit pick, group board, in vs out — keep ~100% reliable.
Real mode is already on main (merged PR #10): Week 1 is the real current board week. Week 2 is a real NFL week on the schedule (merged PR #22) — Demo isolation does not hide it.
Once a player’s current-week game has started, next week’s picks open for them immediately (do not wait for MNF). New joiners after a locked week go to the next week. Any week: a pending pick can still change until that player’s own kickoff if the new game has not started.
Official REAL Week 1 picks (incl Go Giants, Pauli, JaJa → DAL) are already imported — see docs/HANDOFF.md section 6b. Not the demo CSV.
Board / pick-list sort on main: undefeated → one-loss → eliminated, then same pick → same game → nickname A–Z (no-pick last within that status group). Do not sort these lists pick-first, and do not use weeks survived as a list key.
Friends may open the app without picking every week; a missed week still counts as a loss after lock unless I ask to change that rule.
Pick header prev/next week is **on main** (merged PR #14). Do not start a second copy.
No favourite-strength-meter bonus unless I ask. Weekly videos already ship.
My problem: [describe pick / lock / board issue]
```

#### c) Admin tools

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md and docs/REAL-MODE.md first, then only:
- src/app/(app)/admin/page.tsx
- src/app/(app)/admin/import/page.tsx
- src/components/features/admin/
- src/lib/pool-mode.ts
- src/lib/reset-pool.ts
- src/app/api/admin/

You are free / basic Grok chat — not Grok Bot. Owner is not a coder. Click-by-click Admin / Vercel steps.

MUST on main (already shipped):
- Live-only pool (Demo vs Real toggle removed). Reset pool and real administrator login. Do not add a mode switch.
- Seat claim + Player/Administrator roles + Make administrator (merged PR #19). Do not start a second copy.
- Administrator can change a participant pick after the fact (Import week picks, audit-logged). Week 1 is already imported — HANDOFF section 6b.
- Roster real-name editor (including Go Giants, Pauli, JaJa). Pick backup (copy from another member within 30 min of kickoff) is on Account and Admin → Roster.
- Turn off mulligan / one-and-done from a week; **Hand the pool to someone else** (confirm nickname; previous stays a player and loses Admin). Do not start a second copy.

Small PR only. Do not expand into Wave 2 SMS/digests. Weekly videos already ship.
My problem: [describe admin / import / lock-override / mulligan / transfer / mode issue]
```

#### d) Vercel deploy / env vars

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md first, then only:
- DEPLOY.md
- .env.example
- next.config.ts
- package.json (scripts.build must stay `next build`)
- scripts/_dangerous/ensure-production-db.ts
- scripts/assert-not-production.ts
- src/lib/prisma-url.ts
- src/lib/auth.ts
- src/lib/request-host.ts

You are free / basic Grok chat — not Grok Bot. You cannot click Vercel for the owner.
Give click-by-click Vercel steps (team nfl-pool / project survive-sunday).
Production site https://survive-sunday.vercel.app. Neon DATABASE_URL.
Never commit secrets. Watch for AUTH_SECRET missing, AUTH_TRUST_HOST,
and AUTH_URL set to example.com or localhost (app ignores those at runtime; still delete them).
Forgot password is on main (merged PR #7). Production Resend is set (HANDOFF section 4 notification ops). Check spam/junk. Optional Twilio — spell TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER.
CRITICAL: Production `npm run build` is `next build` only. It must never run ensure-production-db, prisma db push, or seed. Do not reattach those to the build script. Crons do not wipe or reseed. Schema/seed are optional one-offs (DEPLOY.md §4), not a Redeploy.
Small PR only if code must change.
My problem: [paste Type error / deploy log snippet / login error — no secrets]
```

#### e) PWA / stay logged in for friends

```
You are helping the Survive Sunday owner explain phone install and stay-logged-in.
Read docs/HANDOFF.md and:
- public/manifest.webmanifest
- public/sw.js
- src/app/layout.tsx
- src/lib/auth.ts
- the “Install the app” section in src/components/HelpContent.tsx

You are free / basic Grok chat — not Grok Bot.
Give iPhone Safari and Android Chrome steps for Add to Home Screen.
Owner is holding the **group invite** until Forgot password delivers a code (check spam/junk) — do not draft a blast unless asked.
Login cookie is ~90 days on main (merged PR #7). If the Home Screen icon opens logged-out, sign in once inside the installed app.
Do not add a code after every login (closed PR #5).
Do not change code unless I ask. No extras.
My problem: [e.g. iPhone friends cannot find Add to Home Screen]
```

#### f) Scores, injuries, NFL team / player research

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md first.
You are free / basic Grok chat — not Grok Bot. Trust main for what is live:
- Scores already sync from ESPN and auto-grade finals (src/lib/live-scores.ts, src/app/(app)/scores/).
- Team pages show record, this week, style (above coach), head coach, then Offence / Defence / Special teams + injuries + news (src/components/features/team/, src/app/(app)/team/[abbr]/, src/lib/team-research.ts, src/lib/team-coaches.ts). No Key players. No full roster dump.
- Tap an NFL player for a detail page (src/app/(app)/team/[abbr]/player/[slug]/page.tsx).
- Injury report on main is ESPN public JSON (src/lib/live-injuries.ts), not sample_injury_news.json.
- Live scores / injuries upgrade already shipped as merged PR #12. Do not invent another feed.
- Real-mode League W-L syncs from ESPN (not demo week2-standings). Do not show player-facing demo League copy.
- Head coach card already shipped as merged PR #20. Do not open a second copy.
- Weekly YouTube videos (Scores / Schedule → **Details**; leftover `/videos` deep link) already ship. Do not invent a second video library. Videos are not a header item.

Canadian TSN / CTV / RDS / DAZN listings are not in the app. Do not invent a live Canadian TV feed.
Small PR only. Do not rewrite picks / board / in-out.
My problem: [describe scores / injuries / team or player page issue]
```

#### g) Rebase / continue an existing open PR (conflicts after main moved)

```
You are helping maintain Survive Sunday with free / basic Grok — not Grok Bot.
Read docs/HANDOFF.md section 10. Trust GitHub main.
Continue the existing open PR I name. Rebase that branch onto latest origin/main.
Do not open a second PR for the same feature. Do not merge. Do not invent extras.
Owner is not a coder: after you push, give click-by-click GitHub steps to review the updated PR.
Password reset PR #7, Real mode PR #10, pick-week nav PR #14, Safari/Sign out PR #18, seat-claim PR #19, board sort PRs #21/#24, Week 2 restore PR #22, Week 1 pick-change PR #25, mulligan/transfer PR #8, player-detail pages PR #11, and head-coach / team-page order PR #20 are already merged — do not reopen them.
My problem: [PR number and what GitHub shows — conflicts / failed checks]
```

---

## 13. Tiny glossary

| Word | Meaning |
|------|---------|
| **PR / pull request** | A proposed change on GitHub. Merge it to `main` to go live. |
| **Merge** | Accept the PR so Vercel can deploy. **You** click this. A basic chat does not. |
| **Draft PR** | A pull request that is not ready to merge yet. None of the live-tonight work is draft. |
| **Rebase** | Replay an open PR’s changes on top of the latest `main` after another PR merged. Ask a chat to continue **that** branch. |
| **Redeploy** | Rebuild the same code with the latest env vars. Compiles only (`next build`). Does **not** push schema, seed, or rewrite live pool data. |
| **Lock** | Picks **reveal** at first kickoff (unless overridden). You can change until **your game starts**. Then **next week opens for you** (do not wait for MNF). No header countdown. |
| **PWA** | Website you can pin to the phone home screen. |
| **Neon** | The hosted database. |
| **Vercel** | The company that hosts the website. |
| **Audit log** | A written record of administrator changes (imports, removals, real-name edits, pool rules, transfer). |
| **Live pool** | The only pool mode. **Week 2** is the current board week. Header **Week N** is the pool week from the slate. Each player’s personal next-pick week can still lag until their own game has started. Demo vs Real toggle was removed. |
| **Practice seat email** | `@survivesunday.demo` on an unclaimed Join seat. Seat claiming, not Demo mode. |
| **Claim seat / Join** | Join via a personal or invite link (`/join?who=` / `/login?invite=`). Friend claims their nickname (e.g. **Pauli**, **Go Giants**, **JaJa**, Gams), sets their own email + password, and keeps that seat’s picks. Cold open is Sign in, not a Home people list. Same email can hold Player + Administrator. **Shipped** ([PR #19](https://github.com/triwithms/survive-sunday/pull/19); invite prefill [#130](https://github.com/triwithms/survive-sunday/pull/130)). |
| **Personal Join link** | Per-person URL from Admin (`/join?who=cannoli-stuffer` when unique). Opens Join with that seat picked. Claimed seats → Sign in. |
| **Pick backup** | Off, copy from a member (30 min), or auto best remaining 2025-rank team (~2 min) if you still have no pick. JaJa copies Gams. |
| **OTP / reset code** | One-time 6-digit code on **Forgot password?** (email first; optional text if a cell is saved). Sign in itself is email + password. Not a code at every login. Production Resend is set (section 4). Check spam/junk. |
| **One-and-done** | Administrator rule: no free mulligan from a chosen week. One loss = out. Banner: “From Week X: no mulligan / one-and-done.” |
| **Hand the pool** | Admin → **Hand the pool to someone else**. Give Admin to another existing member. You stay as a player and lose Admin. They keep playing. Different from **Make administrator**. |
| **Free / basic Grok** | grok.com or xAI chat. First in the **free AI first** order (#1 cost rule): free Grok, then free Claude, then free Gemini. **Not** paid Grok Bot. |

---

*If you update the app, do not automatically rewrite this file. Batch HANDOFF/Help at most once a day.*
