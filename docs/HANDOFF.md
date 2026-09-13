# Survive Sunday — owner handoff

This is the **keep-up guide** for the pool app. It is written for a non-coder. Paste pieces of it into a **free** AI chat (Grok, ChatGPT, etc.) when something breaks or you want a small change. You do **not** need a paid coding bot.

**Source of truth:** this file + the GitHub `main` branch. If a chat and this file disagree, trust the repo. If this file and an open pull request disagree, trust `main` for what friends see **today**, and the open PR list below for what is **not live yet**.

**Never paste secrets** (passwords, `AUTH_SECRET`, `DATABASE_URL`, API keys) into a chat, a screenshot, or a commit.

**Snapshot (13 September 2026):** this branch (PR #7) adds **Forgot password** (email or text code — not a code at every login) and a ~90 day stay-signed-in cookie. `main` already has login/session fixes, ESPN scores/injuries, and confirmed BM Boys real names. Other features still exist only as **open PRs**.

---

## 1. What Survive Sunday is

A **private NFL survivor pool** for friends (2026/27 season). Canadian English (`en-CA`).

**Core loop only (protect this first):**

1. Each player picks **one team to win** that week.
2. After lock (first kickoff), the group can see **everyone’s picks**.
3. The board shows who is still **in** (undefeated / one loss) vs **out** (eliminated).

Rules the live app already enforces:

- You cannot reuse a team later in the season (win or lose).
- First wrong **or missed** pick burns the mulligan → **one loss**.
- Second loss → **eliminated**.
- Bye-week teams are off the board.
- The commissioner is a spectator (not a player) and is not required to pick. The commissioner is hidden from the player board.

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

Invite code for friends: **`SUNDAY26`**.

---

## 3. How it’s built (stack)

Short names you will see in chats. One-line meaning only:

| Name | Meaning |
|------|---------|
| **Next.js App Router** | The website framework. Screens live under `src/app/`. |
| **Auth.js** (also called NextAuth) | Sign-in / stay-logged-in. Files: `src/lib/auth.ts`, `src/app/api/auth/`. |
| **Prisma** | Talks to the database. Shape of the data: `prisma/schema.prisma`. |
| **PWA** | “Add to Home Screen” so it feels like a phone app. `public/manifest.webmanifest`, `public/sw.js`. |

Local laptop work can use any Postgres URL. **Production always uses Neon**, not a file on someone’s computer.

Bottom nav on the live app: **Home** · **Pick** · **Scores** · **League** · **Board** · **Help**. Commissioners also see **Admin**.

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
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | “Continue with Google” on `/login`. Demo picker works without these. |

Live scores and injuries use **ESPN public JSON** — no Vercel key. See [DEPLOY.md](../DEPLOY.md).

### Required for Forgot password (two keys)

Set these **before or right after** merging PR #7. Friends will not receive a reset email until both are on **Production**.

| Name | What to put | If missing |
|------|-------------|------------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free) | Forgot password says we couldn’t send a code. |
| `RESEND_FROM_EMAIL` | A From address Resend has **verified**, e.g. `Survive Sunday <noreply@yourdomain.com>` | Emails fail. `onboarding@resend.dev` only delivers to *your* Resend login email, not friends. |

Click-by-click: [DEPLOY.md](../DEPLOY.md) section **3b**.

### Optional (texts)

| Name | What it does |
|------|----------------|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Text the code if the friend saved a cell. Skip if email is enough today. |

Friends can still **save a cell number** in the header. Missing-pick reminder texts are **not sent yet**.

A full list with local-dev notes is in [`.env.example`](../.env.example) and [`DEPLOY.md`](../DEPLOY.md).

**After you change any env var:** Vercel → **Deployments** → ⋮ on the latest Production deploy → **Redeploy** (do not check “use existing build cache” if login is still broken).

---

## 5. How to deploy (put a fix live)

Normal path — no extra buttons:

1. A change is merged into the **`main`** branch on GitHub.
2. Vercel starts a **Production** deploy by itself.
3. Wait until that deploy is **Ready**.
4. Open [survive-sunday.vercel.app](https://survive-sunday.vercel.app) and try the flow that was broken.

**If you only changed env vars** (no code): Redeploy as in section 4.

**First-time / empty database:** `npm run build` on Vercel also runs a schema sync and seeds the BM Boys demo pool if invite code `SUNDAY26` is missing. Do **not** re-run seed on purpose unless you want demo data refreshed.

On each production build the helper also patches leftover short names in the live database if they are still stored as the old values: Long Snapper `J S` → **John Stilo**, Steve `Steve` → **Steve Venerus**. Changing seed files alone does not fix production. You can also edit any name on **Admin → Roster real names**.

---

## 6. BM Boys roster (confirmed real names)

Nicknames stay as friends know them. Real names show in brackets on the board.

| Nickname | Real name |
|----------|-----------|
| Black Cobra | Justin John |
| Cannoli Stuffer | Michael Frigo |
| Colin | Colin Malone |
| Daddy Chill | Joachim Kuzel |
| Deep and Delicious | Kent Richmond |
| Gams | Robert Gama |
| Gdogss | Tony Gyuro |
| JimmyC | Jim Coulson |
| Long Snapper | John Stilo |
| Steve | Steve Venerus |

These names are in the seed files and the demo picker on `main`. If the live board still says “J S” or just “Steve”, wait for the latest Production deploy, or fix that row on **Admin → Roster real names** (audit-logged; nickname does not change).

---

## 7. How friends use it (what is live today)

### Demo enter (practice picker — still on the live home page)

1. Open the live site.
2. Pick a BM Boys nickname → **Enter as selected**.
3. You land on **Home** (`/pool`) as that person.

Demo password (built in): `demo1234`. Default seat is **Gams**. Commissioner is a small link, not the main button.

The live site is still in this **practice / demo** state. Hiding the picker and the word “demo” is **not on `main` yet** (open PR #10).

### Real login / join

- **Sign in** (`/login`): email + password, or Google if keys are set.
- **Join** (`/join`): invite code **`SUNDAY26`**, nickname, email, password (min 6 characters).
- **Forgot password?** on the sign-in page: we email (or text) a 6-digit code → new password → signed back in. Demo seats stay on **demo1234**. This is **not** a code at every login.

Needs the two Resend keys in section 4, or the page will say we couldn’t send a code.

### Picks

1. Bottom nav → **Pick**.
2. Tap a team that is playing this week and not already used.
3. Confirm. You can change it until **lock**.

Team logos and names on the pick slate open a **team research** page (roster, news, record). Spreads on the pick screen are **static seeded values** (example: “Favourite: KC -3.5”), not a live odds meter.

### Lock

- Lock = first kickoff of the week (unless the commissioner overrides it). Header countdown is labelled as the pick deadline.
- Before lock: only **your** pick is visible.
- After lock: everyone’s picks show; missed picks are applied once; finals are graded.

### Scores & injuries

- **Scores** (and Home / Pick / Schedule) refresh from ESPN while games are on. Finals auto-grade.
- **Team pages** show ESPN’s public injury report (not official NFL). Compact Out / Doubtful / Q chips appear next to picks.
- If ESPN is blocked or down, last saved scores stay; injury cards say the feed failed and link out.

### Standings / in vs out

- **Home** (`/pool`) and **Board** (`/standings`): undefeated → one loss → eliminated, then nickname A–Z.
- You can open Home, Scores, League, Board, Help, and team pages **without** making a pick. If lock hits and a player still has no pick, the app records a **missed pick** (loss / mulligan), except the commissioner.

### Scores, League, team pages

- **Scores** pulls the ESPN scoreboard, shows live / scheduled / final, and auto-grades games that are final. If ESPN is briefly down, the last saved scores stay on screen.
- **League** and **Schedule** are research screens (standings / full slate).
- **Team pages** (`/team/KC` and so on): roster (offence / defence / special teams), college, news links, record. Injury notes on these pages come from a **sample / demo** file — they are **not** live 2026 injury news.
- Tapping an individual NFL **player** for a detail page is **not on `main` yet** (open PR #11).

### Phone / Home Screen (PWA)

- **iPhone:** Safari → Share → Add to Home Screen.
- **Android:** Chrome menu → Install app / Add to Home screen.
- **Computer:** any modern browser. Bookmark if you like.

Stay-logged-in is about **90 days** on this phone/browser (opening the app keeps it fresh). Clearing site data or signing out logs them out. Sign in once inside the Home Screen app if the icon opens logged-out.

---

## 8. Commissioner admin (what is live today)

Sign in as commissioner (`admin@survivesunday.demo` / `demo1234` on demo) → gold **Admin** in the top-right of the header.

| Tool | What it does |
|------|----------------|
| **Import week picks** | Paste or upload `nickname,team` (or `email,team`). This is how you set or **correct a player’s pick after the fact**. Changes are written to the **audit log**. There is no single-player “edit pick” button yet. |
| **Roster real names** | See each nickname + real name. Edit the real name (nickname stays). Audit-logged. |
| Lock controls | Reopen week, unlock (testing), lock now + missed picks, clear override. |
| Simulate scores | Fake remaining finals (demo / testing). |
| Force grade | Grade + apply missed picks now. |
| Remove player | Drops a member from the pool. |

**Not on Admin yet (open PRs):** Real vs Demo mode switch, Reset pool, save a real commissioner email, turn off the mulligan / one-and-done, hand the pool to someone else.

---

## 9. Product priorities — MUST vs BONUS vs not yet shipped

Labelled so a free chat does **not** wander into extras. **MUST** means keep it working or finish it if asked. **BONUS** means do not start unless you ask. **Not yet shipped** means the work may exist as an open PR, but friends do **not** have it on the live site.

### MUST (keep working; fix first)

| Priority | Status on `main` today |
|----------|------------------------|
| ~100% reliable core: submit pick, group board, in vs out | **Built.** Protect this above all else. |
| Commissioner can change a participant pick after the fact | **Built** via **Admin → Import week picks** (audit-logged). No single-player “edit pick” button yet. |
| Friends can use the app without picking every week | **Built.** They can browse without picking. A missed week still counts as a loss after lock. Changing that rule is a product decision — say so explicitly. |
| Transfer ownership (hand Admin to another friend) | **Not shipped.** Open [PR #8](https://github.com/triwithms/survive-sunday/pull/8). Do not invent a transfer screen on `main`. |
| No “demo” labels / practice picker in real season mode | **Not shipped.** Open [PR #10](https://github.com/triwithms/survive-sunday/pull/10). Live home page still shows the practice picker. |
| Simple password reset (code by email or SMS) | **Built in this PR.** Sign in → Forgot password → 6-digit code. Set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` on Vercel or emails will not send. Optional Twilio for texts. Not a code at every login. |
| Add to Home Screen + stay logged in on phone; also mobile web + desktop | **Built.** Install works. Cookie is ~**90 days** (open the app to keep it fresh). |

### Do not build (already decided)

- **A code after every sign-in (2FA).** Closed [PR #5](https://github.com/triwithms/survive-sunday/pull/5). That would block “tap the Home Screen icon and you’re in.” Password-reset codes are only for **Forgot password**, not every login.

### BONUS (do not start unless you ask)

- **Live odds-based favourite strength meter** on the pick screen until kickoff. Today the pick screen shows a **static** spread from seeded data, not a live meter.

Live **scores** and **injury report** (ESPN public JSON) are already wired — not a bonus.

### Later / Wave 2 (do not confuse with MUST)

H2H gloves animation, banter, SMS/email digests, WhatsApp, notification centre, extra visual polish. Listed in the README.

---

## 10. Open / in-progress work (not on `main` yet)

These are real GitHub PRs or in-flight work as of this snapshot. **Do not describe them as live.** After you merge one, update this file in the same PR.

| Work | Where | What it will add (from that PR — not live) |
|------|--------|--------------------------------------------|
| Demo vs Real mode + pool reset | [PR #10](https://github.com/triwithms/survive-sunday/pull/10) | Admin first card: **Real mode** / **Demo mode**. Real mode hides the practice picker and the word “demo”. Optional **Reset pool** (type `RESET`). Save a **real commissioner login**. Playbook will live at `docs/REAL-MODE.md` **after** that PR merges (that file is not on `main` today). |
| Commissioner: turn off mulligan + transfer | [PR #8](https://github.com/triwithms/survive-sunday/pull/8) | **Pool rules — mulligan** (one-and-done from a chosen week; already-scored weeks stay). **Hand the pool to someone else** (existing member only; they keep picks; you stay as a player). |
| NFL player details | [PR #11](https://github.com/triwithms/survive-sunday/pull/11) (draft) | On a team page, tap a **key player** or roster name. Shows number, position, college, starter vs depth, and a **sample / demo** injury note when one exists. Not a page for pool members (Gams, Steve, etc.). |
| Live scores / injuries upgrade | In progress — **no PR on GitHub yet** as of this snapshot | `main` already has ESPN live scores and **sample** injury notes. A further upgrade is being worked on separately. Do not invent a live injury feed until a PR exists and is merged. |

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
- Prisma query engine missing on Vercel (the repo already marks Prisma as a server package and syncs schema on build).

Fix: Vercel env `DATABASE_URL` (Neon integration) → Redeploy so `prisma db push` + seed can run. Do not paste the URL into GitHub.

The credentials lookup now **catches** database errors and returns a normal “wrong email/password” style failure instead of `CallbackRouteError` when it can.

**C. Build type errors**

The site does not go live. Open the deploy **Building** log, copy the `Type error:` block (not npm deprecation warnings), and give that to a **deploy** chat (prompt below).

**D. Demo login works locally but not on the phone**

Use the **same** link the friend opened (the vercel.app URL). Do not mix `localhost` and production. After env fixes, Redeploy, then hard-refresh or re-add to Home Screen.

---

## 12. Maintaining with free Grok (or any free chat)

### Habit

1. Keep **this file** and GitHub `main` as the source of truth.
2. Open a **new free chat per topic** (saves usage). Do not reuse a long “everything” thread.
3. Paste the matching starter prompt + the relevant error text / screenshot (no secrets).
4. Ask for a **small pull request** only. Merge to `main` when you are happy; Vercel deploys.
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
- src/app/login/page.tsx
- src/app/login/forgot/page.tsx
- src/components/ForgotPasswordForm.tsx
- src/app/join/page.tsx
- .env.example
- DEPLOY.md

Owner is not a coder. Explain steps in plain English (en-CA).
Make a small PR. Do not add Wave 2 extras or the live-odds bonus unless I ask.

Honest status:
- Login/session cookie + AUTH_SECRET / AUTH_TRUST_HOST / AUTH_URL pitfalls are already fixed on main.
- Do not rebuild every-login 2FA (closed PR #5).
- Password reset (email/SMS one-time code) is a MUST and lives on this branch / after PR #7 merges. Continue that code; do not start a second copy.
- Stay-logged-in on the phone is ~90 days after PR #7.

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

Core MUST: submit pick, group board, in vs out — keep ~100% reliable.
Friends may open the app without picking every week; a missed week still counts as a loss after lock unless I ask to change that rule.
Small PR only. No favourite-strength-meter bonus unless I ask.
My problem: [describe pick / lock / board issue]
```

#### c) Commissioner tools

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md first, then only:
- src/app/(app)/admin/page.tsx
- src/app/(app)/admin/import/page.tsx
- src/components/AdminPanel.tsx
- src/components/ImportPicksForm.tsx
- src/app/api/admin/

MUST on main: commissioner can change a participant pick after the fact
(today: Import week picks, audit-logged). Roster real-name editor is also on main.

Not on main — continue the existing PR, do not start a second copy:
- Turn off mulligan / one-and-done + transfer commissioner → open PR #8
- Real vs Demo mode, reset pool, real commissioner login → open PR #10

Small PR only. Do not expand into Wave 2 SMS/digests.
My problem: [describe admin / import / lock-override / mulligan / transfer / mode issue]
```

#### d) Vercel deploy / env vars

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md first, then only:
- DEPLOY.md
- .env.example
- next.config.ts
- scripts/ensure-production-db.ts
- src/lib/prisma-url.ts
- src/lib/auth.ts
- src/lib/request-host.ts

Production: Vercel team nfl-pool / project survive-sunday, Neon DATABASE_URL,
site https://survive-sunday.vercel.app.
Never commit secrets. Watch for AUTH_SECRET missing, AUTH_TRUST_HOST,
and AUTH_URL set to example.com or localhost (app ignores those at runtime; still delete them).
Small PR only if code must change; otherwise give click-by-click Vercel steps.
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

Give iPhone Safari and Android Chrome steps for Add to Home Screen.
Login cookie is ~90 days after PR #7. If the Home Screen icon opens logged-out, sign in once inside the installed app.
If the Home Screen icon opens a logged-out screen, sign in once inside the installed app.
Do not add a code after every login (closed PR #5).
Do not change code unless I ask. No extras.
My problem: [e.g. iPhone friends cannot find Add to Home Screen]
```

#### f) Scores, injuries, NFL team / player research

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md first.
Trust main for what is live:
- Scores already sync from ESPN and auto-grade finals (src/lib/live-scores.ts, src/app/(app)/scores/).
- Team pages already show roster / news / record (src/app/(app)/team/[abbr]/page.tsx, src/lib/team-research.ts).
- Injury notes on main are sample / demo (sample_injury_news.json), not live 2026 news.

Not on main:
- Tap an NFL player for a detail page → open draft PR #11. Continue that branch.
- A further live-scores / injuries upgrade may be in progress with no PR yet. Do not invent a live injury feed.

Small PR only. Do not rewrite picks / board / in-out.
My problem: [describe scores / injuries / team or player page issue]
```

---

## 13. Tiny glossary

| Word | Meaning |
|------|---------|
| **PR / pull request** | A proposed change on GitHub. Merge it to `main` to go live. |
| **Merge** | Accept the PR so Vercel can deploy. |
| **Draft PR** | A pull request that is not ready to merge yet. |
| **Redeploy** | Rebuild the same code with the latest env vars. |
| **Lock** | Pick deadline: first kickoff (unless overridden). |
| **PWA** | Website you can pin to the phone home screen. |
| **Neon** | The hosted database. |
| **Vercel** | The company that hosts the website. |
| **Audit log** | A written record of commissioner changes (imports, removals, real-name edits). |
| **Demo / practice picker** | Home-page list of BM Boys nicknames. Still on the live site until Real mode (PR #10) is merged. |
| **OTP** | One-time code (the 6-digit Forgot-password code). Not a code at every login. |
| **One-and-done** | Planned commissioner rule (PR #8): no free mulligan from a chosen week. One loss = out. **Not live.** |
| **Transfer commissioner** | Planned Admin tool (PR #8): give Admin to another existing member. **Not live.** |

---

*If you update the app, update this file in the same PR so the next free chat stays accurate.*
