# Survive Sunday — owner handoff

This is the **keep-up guide** for the pool app. It is written for a **non-coder**. Use **click-by-click** steps here, then paste a starter prompt into a **new chat** when something breaks or you want a small change.

**Intended tool:** **free Grok** or a **basic paid Grok / xAI chat** (topic-split chats; paste prompts from **section 12**).

**Not the intended tool:** paid **Grok Bot**, Cursor desktop agents, or other expensive coding bots. Those are optional later if a change is too big for a basic chat — not the default path.

**Human path that stays the same:** you merge GitHub **pull requests** yourself, then click through **Vercel** (env vars, Redeploy) when this file says to. A chat can tell you which buttons to press. It cannot press them for you.

**Source of truth:** this file + the GitHub **`main`** branch. If a chat and this file disagree, trust the repo. If this file and an open pull request disagree, trust `main` for what friends see **today**, and the open PR list in **section 10** for what is **not live yet**.

**Never paste secrets** (passwords, `AUTH_SECRET`, `DATABASE_URL`, API keys) into a chat, a screenshot, or a commit.

**Snapshot (13 September 2026, afternoon):** latest `main` includes login/session fixes, the AUTH_URL placeholder guard, confirmed BM Boys real names, **live ESPN scores + injury report** (merged [PR #12](https://github.com/triwithms/survive-sunday/pull/12)), **Real vs Demo mode** (squash-merged [PR #10](https://github.com/triwithms/survive-sunday/pull/10)), and **Forgot password** (squash-merged [PR #7](https://github.com/triwithms/survive-sunday/pull/7) at `2df4645`). The Real-mode playbook is on `main` at [`docs/REAL-MODE.md`](./REAL-MODE.md). An earlier handoff refresh ([PR #13](https://github.com/triwithms/survive-sunday/pull/13)) is **superseded by this file**. Forgot password **code is on `main`**; reset codes will not actually send until **Resend** (and optional **Twilio**) env vars are set on Vercel, then Redeploy.

**Friends:** hold install / invite messages until the pool is closer to ready (Real-mode board cleaned up, official Week 1 picks imported, Resend keys added so Forgot password can send a code).

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

Forgot password is **on `main`** (merged [PR #7](https://github.com/triwithms/survive-sunday/pull/7)). Friends will not receive a reset email until both keys are on **Production**, then Redeploy.

| Name | What to put | If missing |
|------|-------------|------------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free) | Forgot password says we couldn’t send a code. |
| `RESEND_FROM_EMAIL` | A From address Resend has **verified**, e.g. `Survive Sunday <noreply@yourdomain.com>` | Emails fail. `onboarding@resend.dev` only delivers to *your* Resend login email, not friends. |

Click-by-click: [DEPLOY.md](../DEPLOY.md) section **3b**. After you add them: Vercel → **Deployments** → ⋮ on the latest Production deploy → **Redeploy**.

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

### How you merge a pull request (you do this; a chat does not)

1. Open the PR link (section 10).
2. Read the title. Confirm it is the change you asked for.
3. If GitHub says the branch has **conflicts** or is **out of date** with `main`, do **not** mash Merge. Open a **new** free Grok chat, paste prompt **(g)** in section 12, and give it that PR number so it can continue **that** branch.
4. When GitHub shows it can merge and you are happy: **Merge pull request**. Squash is fine (that is how Real mode landed).
5. Wait for Vercel Production to go **Ready**.

**First-time / empty database:** `npm run build` on Vercel also runs a schema sync and seeds the BM Boys demo pool if invite code `SUNDAY26` is missing. Do **not** re-run seed on purpose unless you want demo data refreshed.

On each production build the helper also patches leftover short names in the live database if they are still stored as the old values: Long Snapper `J S` → **John Stilo**, Steve `Steve` → **Steve Venerus**. Changing seed files alone does not fix production. You can also edit any name on **Admin → Roster**. If the pool is already in **Real mode**, the same build snaps it to **Week 1** and clears leftover **Week 2** sandbox picks.

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

These names are in the seed files. Production is also patched on deploy (Long Snapper `J S` → John Stilo, Steve → Steve Venerus). You can edit any row on **Admin → Roster**.

---

## 6b. Official REAL Week 1 picks (not the demo sample)

These are the **real** Week 1 picks the owner confirmed. They are **not** automatically on the live board. Demo seed rows (SF / CAR / TB / IND / DET / HOU / NYJ / ATL / KC for the wrong people, and so on) previously **polluted** the board. The fix path is: **Admin → Real mode**, then **Import week picks** for week **1** (optional **Reset pool** first if you want a clean slate). Playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md).

Do **not** use `public/examples/week1-picks-import.csv` or `data/week1-picks-status.md` as the official list — those still have demo / partial sample data.

Paste this into **Admin → Import week picks** (week **1**), then Preview matches and Confirm:

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
```

---

## 7. How friends use it

The pool has two commissioner-controlled modes. Full playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md). **This is shipped on `main`** (merged PR #10). Do not describe Real mode as “open PR #10” or “not shipped.”

- **Real mode (use this for the season):** home shows **Who are you?** (live roster), **Join**, and **Sign in**. Friends never see the word “demo” or the `demo1234` practice picker. The pool sits on **Week 1**. Week 2 is hidden from participants.
- **Demo mode (commissioner / testing):** practice account picker is visible. Demo copy is allowed. Week **2** is the commissioner sandbox only.

A new empty database still **seeds in Demo mode**. After deploy, open **Admin** and tap **Real mode** if the home page still shows the practice picker.

### Demo enter (Demo mode only)

1. Open the live site while the pool is in **Demo mode**.
2. Pick a BM Boys nickname → **Enter as selected**.
3. You land on **Home** (`/pool`) as that person.

Demo password (built in): `demo1234`. Default seat is **Gams**. Commissioner is a small link, not the main button. In **Real mode** this picker is hidden and `/api/demo-enter` is blocked.

### Real login / join

- **Sign in** (`/login`): email + password, or Google if keys are set.
- **Join** (`/join`): pick yourself from the **live roster** (nickname + real name), invite code **`SUNDAY26`**, then your own email and password (min 6 characters). That claims the existing seat so Week 1 picks stay. If the seat already has a real email, the page says it is claimed — Sign in instead. Practice `@survivesunday.demo` seats are claimable. **Commissioner email can also claim a player seat** (Gams) — same login holds **Player** and **Administrator**. Use **Playing as Gams** / **Admin tools** to switch. People not on the list can still join as a new player.
- **Forgot password?** on the sign-in page: we email (or text) a 6-digit code → new password → signed back in. Demo seats stay on **demo1234**. This is **not** a code at every login.

The **Forgot password?** screen is on `main` (merged PR #7). It still needs the two Resend keys in section 4, or the page will say we couldn’t send a code. Optional Twilio for texts. Do not claim codes are sending until those keys are set and Production is Redeployed.

### Picks

1. Bottom nav → **Pick**.
2. Tap a team that is playing this week and not already used.
3. Confirm. You can change it until **lock**.

On `main`, Pick shows the current week (Week 1 in Real mode). Previous/next week arrows on the Pick header shipped with [PR #14](https://github.com/triwithms/survive-sunday/pull/14).

Team logos and names on the pick slate open a **team research** page (roster, news, record). Spreads on the pick screen are **static seeded values** (example: “Favourite: KC -3.5”), not a live odds meter.

### Lock

- Lock = first kickoff of the week (unless the commissioner overrides it). Header countdown is labelled as the pick deadline.
- Before lock: only **your** pick is visible.
- After lock: everyone’s picks show; missed picks are applied once; finals are graded.

### Scores & injuries (live on `main`)

- **Scores** (and Home / Pick / Schedule) refresh from ESPN while games are on. Finals auto-grade.
- **Team pages** show ESPN’s public injury report (not official NFL). Compact Out / Doubtful / Q chips appear next to picks.
- If ESPN is blocked or down, last saved scores stay; injury cards say the feed failed and link out.
- `data/sample_injury_news.json` is schema-only and is **not** shown in the UI on `main`.

### Standings / in vs out

- **Home** (`/pool`) and **Board** (`/standings`): undefeated → one loss → eliminated, then nickname A–Z.
- You can open Home, Scores, League, Board, Help, and team pages **without** making a pick. If lock hits and a player still has no pick, the app records a **missed pick** (loss / mulligan), except the commissioner.

### Scores, League, team pages

- **Scores** pulls the ESPN scoreboard, shows live / scheduled / final, and auto-grades games that are final.
- **League** and **Schedule** are research screens (standings / full slate). Kickoff times in the app are the **US slate** (ET + US networks such as CBS / Fox / NBC).
- **Team pages** (`/team/KC` and so on): roster, college, news links, record, and ESPN’s public injury report (not official NFL).
- Tapping an individual NFL **player** for a detail page is **not on `main` yet** (open [PR #11](https://github.com/triwithms/survive-sunday/pull/11)).

### Canadian TV (when you share a schedule — not in the app)

The app does **not** list Canadian channels. When you text or email friends a slate (or later Wave 2 digests), add **Canadian** times and channels yourself: **TSN**, **CTV**, **RDS**, **DAZN** (plus kickoff in local time). Do not ask a chat to invent a live Canadian-listings feed.

### Phone / Home Screen (PWA)

- **iPhone:** Safari → Share → Add to Home Screen.
- **Android:** Chrome menu → Install app / Add to Home screen.
- **Computer:** any modern browser. Bookmark if you like.

Stay-logged-in is about **90 days** on this phone/browser (opening the app keeps it fresh). Clearing site data or signing out logs them out. Sign in once inside the Home Screen app if the icon opens logged-out.

Hold friend install instructions until you are closer to ready.

---

## 8. Commissioner admin

**Admin** is the gold link in the top-right of the header. The **first card** is **Real mode vs Demo mode** — two big buttons. Tap **Real mode** for Week 1 (this NFL week). Week 2 is Demo-only.

First real commissioner login: Admin → **Your commissioner login** → your real email + password → save → sign out → **Sign in** with that email. Do not keep using `admin@survivesunday.demo` after that. Full playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md).

While Demo mode is on you can still **Enter as commissioner** (`admin@survivesunday.demo` / `demo1234`) to reach Admin and set the real login.

| Tool | What it does |
|------|----------------|
| **Real mode vs Demo mode** | First card on Admin. Tap **Real mode** or **Demo mode**. Real = Week 1, no `demo1234` practice picker. Friends pick their name from the live roster, then set their own email. Demo = Week 2 sandbox for the commissioner. **Shipped.** |
| **Your commissioner login** | Replace the practice commissioner email with a real email + password. Then sign out and sign in with that email. **Shipped.** |
| **Reset pool** | Optional. Real mode is already Week 1. Clears picks, removes practice accounts (`@survivesunday.demo`), resets everyone to undefeated. Type `RESET` to confirm. Does **not** wipe Auth/env. **Shipped.** |
| **Roster** | See each nickname + real name. Edit either when wrong. Audit-logged. |
| **Import week picks** | Paste or upload `nickname,team` (or `email,team`). This is how you set or **correct a player’s pick after the fact**. Use the official Week 1 list in **section 6b**. Changes are written to the **audit log**. There is no single-player “edit pick” button yet. |
| Lock controls | Reopen week, unlock (testing), lock now + missed picks, clear override. |
| Simulate scores | Fake remaining finals (testing). |
| Force grade | Grade + apply missed picks now. |
| Remove player | Drops a member from the pool. |
| Demo lock toggle | Header **Before / After deadline** — commissioner only, and only in Demo mode. |
| **Administrators** | Grant Admin tools to an existing pool player (confirm). They stay on the board. Remove Admin is allowed only if another administrator remains. **On [PR #19](https://github.com/triwithms/survive-sunday/pull/19) — not on `main` until you merge it.** |

**Not on Admin yet (other open PRs):** turn off the mulligan / one-and-done, **hand the whole pool** to someone else (they become the commissioner seat — [PR #8](https://github.com/triwithms/survive-sunday/pull/8)). That is different from **Make administrator** on PR #19 (they keep playing).

---

## 9. Product priorities — MUST vs BONUS vs not yet shipped

Labelled so a basic Grok chat does **not** wander into extras. **MUST** means keep it working or finish it if asked. **BONUS** means do not start unless you ask. **Not yet shipped** means the work may exist as an open PR, but friends do **not** have it on the live site.

### MUST (keep working; fix first)

| Priority | Status on `main` today |
|----------|------------------------|
| ~100% reliable core: submit pick, group board, in vs out | **Built.** Protect this above all else. |
| Commissioner can change a participant pick after the fact | **Built** via **Admin → Import week picks** (audit-logged). No single-player “edit pick” button yet. |
| Friends can use the app without picking every week | **Built.** They can browse without picking. A missed week still counts as a loss after lock. Changing that rule is a product decision — say so explicitly. |
| Transfer ownership (hand Admin to another friend) | **Not shipped.** Open [PR #8](https://github.com/triwithms/survive-sunday/pull/8). Do not invent a transfer screen on `main`. |
| No “demo” labels / `demo1234` practice picker in real season mode | **Shipped** (merged [PR #10](https://github.com/triwithms/survive-sunday/pull/10)). Admin → **Real mode**. Real = Week 1. Week 2 is Demo-only. Playbook: [`docs/REAL-MODE.md`](./REAL-MODE.md). |
| Friends pick themselves from the live roster and claim that seat | **Not shipped.** Open [PR #19](https://github.com/triwithms/survive-sunday/pull/19). Join + logged-out Home show nickname + real name from the Admin roster. Claiming attaches email/password to the existing seat. Already-claimed seats say Sign in instead. Same email can be **Player + Administrator**; switch with **Playing as …** / **Admin tools**. Admin can promote another existing member. |
| Simple password reset (code by email or SMS) | **Merged / shipping** ([PR #7](https://github.com/triwithms/survive-sunday/pull/7)). Sign in → **Forgot password?** → 6-digit code is on `main`. Set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` on Vercel or emails will not send. Optional Twilio for texts. Not a code at every login. |
| Add to Home Screen + stay logged in on phone; also mobile web + desktop | **Built.** Install works. Cookie on `main` is ~**90 days** (open the app to keep it fresh). |

### Do not build (already decided)

- **A code after every sign-in (2FA).** Closed [PR #5](https://github.com/triwithms/survive-sunday/pull/5). That would block “tap the Home Screen icon and you’re in.” Password-reset codes are only for **Forgot password**, not every login.

### BONUS (do not start unless you ask)

- **Live odds-based favourite strength meter** on the pick screen until kickoff. Today the pick screen shows a **static** spread from seeded data, not a live meter.
- **Weekly video previews** — lowest priority; see Later / Wave 2. Do not start unless the owner asks.

Live **scores** and **injury report** (ESPN public JSON) are already wired on `main` — not a bonus.

### Later / Wave 2 (do not confuse with MUST)

Lowest priority. Do **not** start unless the owner asks. None of this is on `main`.

- H2H gloves animation, banter, SMS/email digests, WhatsApp, notification centre, extra visual polish. Listed in the README. If digests ever happen, include Canadian TV (TSN / CTV / RDS / DAZN) in the copy — that is not an app feature today.
- **Weekly video previews (lowest priority):** a Help and/or Home section (or a simple link) with **curated** video links for that week — about **1–2 short** (5–10 min), **1–2 medium** (10–20 min), and **1–2 long** (20 min up to ~2.5 hr). Sources: **NFL YouTube channel**, **ESPN**, and/or **TSN**. Links only / embed-friendly preview. **Not** required for core picks / board / in-vs-out. Do not invent a live video feed or scrape YouTube. Do not implement this unless the owner asks. A free or basic Grok chat may later *draft a short list of official links* if asked — that is still not a feature on `main`.

---

## 10. Shipped vs still open (13 September 2026 afternoon)

Re-checked against GitHub. **Do not describe an open PR as live.** After you merge one, update this file in the same PR.

### Already on `main` (done — do not re-open)

| Work | PR | What friends have today |
|------|-----|-------------------------|
| Login / session cookie + AUTH_URL placeholder guard | several early merges | Sign-in and demo-enter keep a session when env vars are set. |
| BM Boys real names + Roster editor | [#9](https://github.com/triwithms/survive-sunday/pull/9) | John Stilo / Steve Venerus / Tony Gyuro, plus Admin → Roster. |
| Owner handoff (first pass) | [#13](https://github.com/triwithms/survive-sunday/pull/13) | **Superseded by this file.** |
| Live ESPN scores + injury report | [#12](https://github.com/triwithms/survive-sunday/pull/12) | Scores poll ESPN; team pages + chips use ESPN injuries. No paid key. |
| Real vs Demo mode, Week 1 isolation, reset, real commissioner login | [#10](https://github.com/triwithms/survive-sunday/pull/10) (squash-merged) | Admin first card. Real = Week 1, no practice picker. Week 2 = Demo-only. [`docs/REAL-MODE.md`](./REAL-MODE.md) is on `main`. |
| Forgot password + ~90 day stay-logged-in | [#7](https://github.com/triwithms/survive-sunday/pull/7) (squash-merged, `2df4645`) | Sign in → **Forgot password?** → 6-digit code → new password. **Merged / shipping.** Codes send only after Resend (optional Twilio) env vars are on Vercel + Redeploy. |
| Pick header previous / next week | [#14](https://github.com/triwithms/survive-sunday/pull/14) | Chevrons around the gold `W#` badge; `?week=` like Home / Scores. Past / future weeks read-only. |

### Open — not on `main` yet

| Work | Where | What it will add (from that PR — not live) |
|------|--------|--------------------------------------------|
| Commissioner: turn off mulligan + transfer | [PR #8](https://github.com/triwithms/survive-sunday/pull/8) | **Pool rules — mulligan** (one-and-done from a chosen week; already-scored weeks stay). **Hand the pool to someone else** (existing member only; they keep picks; you stay as a player). Branch `cursor/commissioner-mulligan-transfer-a878`. May need a rebase onto latest `main`. |
| NFL player details | [PR #11](https://github.com/triwithms/survive-sunday/pull/11) (open, **not draft**) | On a team page, tap a **key player** or roster name. Shows number, position, college, starter vs depth. That PR’s own injury notes were **sample / demo** — `main` already has ESPN injuries on team pages, so a rebase should not invent a second feed. Branch `cursor/nfl-player-team-details-a32a`. |
| Who are you? live-roster claim + Player/Admin roles | [PR #19](https://github.com/triwithms/survive-sunday/pull/19) | Friends pick `Gams (Robert Gama)` from the **live Admin roster**, set their own email + password + `SUNDAY26`, and keep that seat’s Week 1 picks. **One user, multiple roles** (not a separate admin account). Same email can be Player + Administrator; switch views; promote another member. Existing login uses the **same Sign in password**, or **Sign in first** then claim with one tap. Roles table is extensible (Watcher reserved, not built). **Not** the Demo-mode `demo1234` picker. |

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
- Prisma query engine missing on Vercel (the repo already marks Prisma as a server package and syncs schema on build).

Fix: Vercel env `DATABASE_URL` (Neon integration) → Redeploy so `prisma db push` + seed can run. Do not paste the URL into GitHub.

The credentials lookup now **catches** database errors and returns a normal “wrong email/password” style failure instead of `CallbackRouteError` when it can.

**C. Build type errors**

The site does not go live. Open the deploy **Building** log, copy the `Type error:` block (not npm deprecation warnings), and give that to a **deploy** chat (prompt below).

**D. Demo login works locally but not on the phone**

Use the **same** link the friend opened (the vercel.app URL). Do not mix `localhost` and production. After env fixes, Redeploy, then hard-refresh or re-add to Home Screen.

**E. Board still shows demo sample picks (SF / CAR / TB / …)**

Those are leftover seed / example rows, not the official Week 1 list. Tap **Admin → Real mode**, then import the CSV in **section 6b** (reset first if you want a clean board). Do not ask a chat to invent a live data feed to “fix” picks.

---

## 12. Maintaining with free or basic Grok (not Grok Bot)

### What basic Grok can vs cannot do well

**Good for**

- Explaining a Vercel / browser error in plain English (en-CA)
- Drafting a **small** code patch as “open this PR / change these files”
- Click-by-click Vercel and GitHub steps (env vars, Redeploy, Merge)
- Updating **this file** when something ships
- Reordering copy, Help text, or a CSV the owner will paste
- Diagnosing `AUTH_SECRET` / `AUTH_URL` / `AUTH_TRUST_HOST` / `NoSession` / `CallbackRouteError` from a **redacted** log snippet

**Weak / risky — do not pretend a basic chat can drive these alone**

- Multi-file refactors that touch Auth.js + Prisma + Neon together (needs a proper coding agent, or a human who can run the app)
- Merging **conflicting** PRs or resolving git conflicts across several branches
- Clicking Vercel / GitHub **for** the owner
- Inventing live data feeds, weekly video libraries, Canadian channel listings, or features as if they were already on `main`

**Rules for every chat**

1. Prefer **one small PR per chat**.
2. **Continue** an existing open PR branch. Never reopen password reset (merged PR #7) or Real mode (merged PR #10). Never open a second copy of mulligan/transfer, player pages, or pick-week nav.
3. **Never invent features as “live.”** If it is not on `main` (section 10), say it is not shipped.
4. Owner is **not a coder** — every answer needs click-by-click GitHub / Vercel / Admin steps, not “run this locally.”
5. Do not use or recommend **paid Grok Bot**, Cursor desktop agents, or other expensive coding bots unless the owner explicitly asks after a basic chat hits a wall.

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
Make one small PR. Do not add Wave 2 extras, the live-odds bonus, or weekly video previews unless I ask.

Honest status:
- Login/session cookie + AUTH_SECRET / AUTH_TRUST_HOST / AUTH_URL pitfalls are already fixed on main.
- Do not rebuild every-login 2FA (closed PR #5).
- Password reset (email/SMS one-time code) is **on main** (merged PR #7). Do not start a second copy. Do not claim codes are sending until Resend (optional Twilio) env vars are on Vercel and Production is Redeployed.
- Stay-logged-in on the phone is ~90 days on main.

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
Real mode is already on main (merged PR #10): Week 1 is the real default; Week 2 is Demo-only.
Official REAL Week 1 picks are in docs/HANDOFF.md section 6b — not the demo CSV.
Friends may open the app without picking every week; a missed week still counts as a loss after lock unless I ask to change that rule.
Pick header prev/next week is open draft PR #14 (branch cursor/pick-week-nav-6845) — continue that branch, do not start a second copy, do not claim it is live.
No favourite-strength-meter bonus or weekly video previews unless I ask.
My problem: [describe pick / lock / board issue]
```

#### c) Commissioner tools

```
You are helping maintain Survive Sunday. Read docs/HANDOFF.md and docs/REAL-MODE.md first, then only:
- src/app/(app)/admin/page.tsx
- src/app/(app)/admin/import/page.tsx
- src/components/AdminPanel.tsx
- src/components/PoolModePanel.tsx
- src/components/RosterEditor.tsx
- src/components/CommissionerAccountPanel.tsx
- src/app/(app)/admin/roster/page.tsx
- src/components/ImportPicksForm.tsx
- src/lib/pool-mode.ts
- src/lib/reset-pool.ts
- src/app/api/admin/

You are free / basic Grok chat — not Grok Bot. Owner is not a coder. Click-by-click Admin / Vercel steps.

MUST on main (already shipped):
- Real vs Demo mode, reset pool, real commissioner login (merged PR #10). Do not open another Real-mode PR.
- Commissioner can change a participant pick after the fact (Import week picks, audit-logged). Official Week 1 CSV is HANDOFF section 6b.
- Roster real-name editor.

Not on main — continue the existing PR, do not start a second copy:
- Turn off mulligan / one-and-done + transfer commissioner → open PR #8 (branch cursor/commissioner-mulligan-transfer-a878)

Small PR only. Do not expand into Wave 2 SMS/digests or weekly video previews.
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

You are free / basic Grok chat — not Grok Bot. You cannot click Vercel for the owner.
Give click-by-click Vercel steps (team nfl-pool / project survive-sunday).
Production site https://survive-sunday.vercel.app. Neon DATABASE_URL.
Never commit secrets. Watch for AUTH_SECRET missing, AUTH_TRUST_HOST,
and AUTH_URL set to example.com or localhost (app ignores those at runtime; still delete them).
Forgot password is on main (merged PR #7). Codes send only after RESEND_API_KEY + RESEND_FROM_EMAIL (optional Twilio) are on Production, then Redeploy.
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
Owner is holding friend install / invite messages until closer to ready — do not draft a blast unless asked.
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
- Team pages already show roster / news / record (src/app/(app)/team/[abbr]/page.tsx, src/lib/team-research.ts).
- Injury report on main is ESPN public JSON (src/lib/live-injuries.ts), not sample_injury_news.json.
- Live scores / injuries upgrade already shipped as merged PR #12. Do not invent another feed.

Not on main:
- Tap an NFL player for a detail page → open PR #11 (branch cursor/nfl-player-team-details-a32a). Continue that branch. Do not claim it is live.

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
Password reset PR #7 is already merged — do not reopen it. Also open: PR #8 mulligan/transfer, PR #11 player details, draft PR #14 pick week nav (conflicts vs main).
My problem: [PR number and what GitHub shows — conflicts / failed checks]
```

---

## 13. Tiny glossary

| Word | Meaning |
|------|---------|
| **PR / pull request** | A proposed change on GitHub. Merge it to `main` to go live. |
| **Merge** | Accept the PR so Vercel can deploy. **You** click this. A basic chat does not. |
| **Draft PR** | A pull request that is not ready to merge yet (example: PR #14). |
| **Rebase** | Replay an open PR’s changes on top of the latest `main` after another PR merged. Ask a chat to continue **that** branch. |
| **Redeploy** | Rebuild the same code with the latest env vars. |
| **Lock** | Pick deadline: first kickoff (unless overridden). |
| **PWA** | Website you can pin to the phone home screen. |
| **Neon** | The hosted database. |
| **Vercel** | The company that hosts the website. |
| **Audit log** | A written record of commissioner changes (imports, removals, real-name edits). |
| **Real mode** | Season mode on `main` (merged PR #10). Hides the practice picker. Week 1 only for friends. |
| **Demo / practice picker** | Home-page list of BM Boys nicknames with built-in `demo1234`. Visible only while **Demo mode** is on. |
| **Who are you? / claim seat** | Real-mode Join (and logged-out Home) list from the **live Admin roster**. Friend picks their nickname, sets their own email + password, and keeps that seat’s picks. Same email can hold Player + Administrator. Open [PR #19](https://github.com/triwithms/survive-sunday/pull/19) — **not on `main` until you merge it.** |
| **OTP** | One-time code (the 6-digit Forgot-password screen on `main`, merged PR #7). Not a code at every login. Codes send only after Resend keys are on Vercel. |
| **One-and-done** | Planned commissioner rule (PR #8): no free mulligan from a chosen week. One loss = out. **Not live.** |
| **Transfer commissioner** | Planned Admin tool (PR #8): give Admin to another existing member. **Not live.** |
| **Free / basic Grok** | grok.com or xAI chat. The intended maintenance tool. **Not** paid Grok Bot. |

---

*If you update the app, update this file in the same PR so the next free or basic Grok chat stays accurate.*
