# Survive Sunday — owner handoff

This is the **keep-up guide** for the pool app. It is written for a non-coder. You can paste pieces of it into a **free** AI chat (Grok, ChatGPT, etc.) when something breaks. You do **not** need a paid coding bot.

**Source of truth:** this file + the GitHub repo. If a chat and this file disagree, trust the repo.

**Never paste secrets** (passwords, `AUTH_SECRET`, `DATABASE_URL`, API keys) into a chat, a screenshot, or a commit.

---

## 1. What Survive Sunday is

A **private NFL survivor pool** for friends (2026/27 season). Canadian English (`en-CA`).

**Core loop only:**

1. Each player picks **one team to win** that week.
2. After lock (first kickoff), the group can see **everyone’s picks**.
3. The board shows who is still **in** (undefeated / one loss) vs **out** (eliminated).

Rules the app already enforces:

- You cannot reuse a team later in the season (win or lose).
- First wrong **or missed** pick burns the mulligan → **one loss**.
- Second loss → **eliminated**.
- Bye-week teams are off the board.
- The commissioner is a spectator (not a player) and is not required to pick.

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

---

## 4. Secrets on Vercel (env vars)

**Env vars** = private settings Vercel injects at build/run time. They are **not** in GitHub.

Open: [vercel.com](https://vercel.com) → team **nfl-pool** → project **survive-sunday** → **Settings → Environment Variables**.

### Required for the live site

| Name | What to put | If missing or wrong |
|------|-------------|---------------------|
| `AUTH_SECRET` | Long random string (Vercel can generate one, or a trusted person runs `openssl rand -base64 32`) | Sign-in 500s. Demo login lands on `?error=NoSession`. |
| `AUTH_TRUST_HOST` | `true` | Auth.js may ignore the real site address. |
| `DATABASE_URL` | Set automatically by the **Neon** Vercel integration. Do not type it into the repo. | Login / join / picks fail. Often shows as `CallbackRouteError`. |
| `AUTH_URL` | Prefer **leaving this unset** on Vercel. If you set it, it **must** be `https://survive-sunday.vercel.app` | The app ignores leftover `https://example.com` (and localhost) so Host + `AUTH_TRUST_HOST` win. Still delete a placeholder so Auth.js is not pinned at build time. |
| `NEXT_PUBLIC_APP_URL` | `https://survive-sunday.vercel.app` | Public links / app URL can be wrong. |

### Optional (not required for demo)

| Name | What it does |
|------|----------------|
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | “Continue with Google” on `/login`. Demo picker works without these. |

Live scores and injuries use **ESPN public JSON** — no Vercel key. See [DEPLOY.md](../DEPLOY.md).

### Not on the live app today

There are **no** email or SMS send keys on this branch (no Resend / Twilio env vars in `.env.example`). Phone numbers can be saved for later reminders; texts are not sent yet.

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

---

## 6. How friends use it

### Demo enter (try the pool with no password box)

1. Open the live site.
2. Pick a BM Boys nickname → **Enter as selected**.
3. You land on **Home** (`/pool`) as that person.

Demo password (built in): `demo1234`. Default seat is **Gams**. Commissioner is a small link, not the main button.

### Real login / join

- **Sign in** (`/login`): email + password, or Google if keys are set.
- **Join** (`/join`): invite code **`SUNDAY26`**, nickname, email, password (min 6 characters).

There is **no “forgot password”** screen yet (see Must-haves).

### Picks

1. Bottom nav → **Pick**.
2. Tap a team that is playing this week and not already used.
3. Confirm. You can change it until **lock**.

### Lock

- Lock = first kickoff of the week (unless the commissioner overrides it).
- Before lock: only **your** pick is visible.
- After lock: everyone’s picks show; missed picks are applied once; finals are graded.

### Scores & injuries

- **Scores** (and Home / Pick / Schedule) refresh from ESPN while games are on. Finals auto-grade.
- **Team pages** show ESPN’s public injury report (not official NFL). Compact Out / Doubtful / Q chips appear next to picks.
- If ESPN is blocked or down, last saved scores stay; injury cards say the feed failed and link out.

### Standings / in vs out

- **Home** (`/pool`) and **Board** (`/standings`): undefeated → one loss → eliminated, then nickname A–Z.
- You can open Home, Scores, Board, and Help **without** making a pick. If lock hits and a player still has no pick, the app records a **missed pick** (loss / mulligan), except the commissioner.

### Commissioner admin

Sign in as commissioner (`admin@survivesunday.demo` / `demo1234` on demo) → header **Admin**.

| Tool | What it does |
|------|----------------|
| **Import week picks** | Paste or upload `nickname,team` (or `email,team`). This is how you set or **correct a player’s pick after the fact**. Changes are written to the **audit log**. |
| Lock controls | Reopen week, unlock (testing), lock now + missed picks, clear override. |
| Simulate scores | Fake remaining finals (demo / testing). |
| Force grade | Grade + apply missed picks now. |
| Remove player | Drops a member from the pool. |

---

## 7. Must-haves vs later extras

Labelled so a free chat does **not** wander into extras.

### MUST (keep these working; fix first)

| Must | Today’s status (this repo) |
|------|----------------------------|
| ~100% reliable core: submit pick, group board, in vs out | Built. Protect this above all else. |
| Commissioner can change a participant pick after the fact | Built via **Admin → Import week picks** (audit-logged). No single-player “edit pick” button yet. |
| Friends can use the app without picking every week | Built: they can browse without picking. A missed week still counts as a loss after lock. Changing that rule is a product decision — say so explicitly. |
| Simple password reset (code by email or SMS) | **Not built.** Friends who forget a password need a human workaround until this exists. |
| Add to Home Screen + stay logged in on phone; also mobile web + desktop | PWA install is built. Login is a cookie (~30 days by Auth.js default). Clearing site data or signing out logs them out. |

### BONUS (do not start unless you ask)

- **Live odds-based favourite strength meter** on the pick screen until kickoff. Today the pick screen shows a **static** “Favourite: KC -3.5” from seeded spreads, not a live meter.

Live **scores** and **injury report** (ESPN public JSON) are already wired — not a bonus.

### Later / Wave 2 (do not confuse with MUST)

H2H gloves animation, banter, SMS/email digests, WhatsApp, notification centre, extra visual polish. Listed in the README.

---

## 8. When something breaks

### How to read Vercel (no jargon)

1. Open Vercel → **nfl-pool** → **survive-sunday**.
2. **Deployments** = each build. Red = failed. **Ready** = live (for Production).
3. Click a failed deploy → **Building** log. A **type error** looks like `Type error:` and a file path (example that already happened: `src/lib/request-host.ts` `RequestInit` / `signal` mismatch).
4. For a **Ready** site that still misbehaves: open that deploy → **Logs** (or **Runtime Logs**). Search for `auth`, `Prisma`, `Neon`, `NoSession`, `CallbackRouteError`.

### Real incidents and the usual fix

**A. `NoSession` or “problem with the server configuration”**

Friends land on `/?error=NoSession`. `/api/auth/session` or `/api/auth/csrf` may 500.

1. Confirm `AUTH_SECRET` is set on **Production**.
2. Confirm `AUTH_TRUST_HOST=true`.
3. Check `AUTH_URL`. If it is `https://example.com` (or localhost), **delete it** or set it to `https://survive-sunday.vercel.app`. The app also ignores those leftover values at runtime.
4. Redeploy.

**B. `CallbackRouteError` (or “Configuration” on the login page)**

Auth.js is running, but the **database lookup** threw. Common causes:

- Neon / `DATABASE_URL` missing or not reachable.
- Schema never pushed / demo pool never seeded (`SUNDAY26` missing).
- Prisma query engine missing on Vercel (the repo already marks Prisma as a server package and syncs schema on build).

Fix: Vercel env `DATABASE_URL` (Neon integration) → Redeploy so `prisma db push` + seed can run. Do not paste the URL into GitHub.

**C. Build type errors**

The site does not go live. Open the deploy **Building** log, copy the `Type error:` block (not npm deprecation warnings), and give that to a **deploy** chat (prompt below).

**D. Demo login works locally but not on the phone**

Use the **same** link the friend opened (the vercel.app URL). Do not mix `localhost` and production. After env fixes, Redeploy, then hard-refresh or re-add to Home Screen.

---

## 9. Maintaining with free AI

### Habit

1. Keep **this file** and GitHub as the source of truth.
2. Open a **new free chat per topic** (saves usage). Do not reuse a long “everything” thread.
3. Paste the matching starter prompt + the relevant error text / screenshot (no secrets).
4. Ask for a **small pull request** only. Merge to `main` when you are happy; Vercel deploys.

### What to attach

- Link to this file: `docs/HANDOFF.md`
- The folder list in the prompt (already included)
- Vercel error text, not the whole log

### Starter prompts (copy-paste)

Replace the last sentence with your actual problem.

#### a) Login / auth / password reset

```
You are helping maintain Survive Sunday, a private NFL survivor pool PWA.
Read docs/HANDOFF.md first, then only these paths:
- src/lib/auth.ts
- src/lib/credentials-user.ts
- src/lib/demo-session.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/app/api/demo-enter/route.ts
- src/app/login/page.tsx
- src/app/join/page.tsx
- .env.example
- DEPLOY.md

Owner is not a coder. Explain steps in plain English.
Make a small PR. Do not add Wave 2 extras or the live-odds bonus unless I ask.
Password reset (email/SMS one-time code) is a MUST if we are implementing it; it is not built yet.
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

MUST: commissioner can change a participant pick after the fact (today: Import week picks, audit-logged).
Small PR only. Do not expand into Wave 2 SMS/digests.
My problem: [describe admin / import / lock-override issue]
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

Production: Vercel team nfl-pool / project survive-sunday, Neon DATABASE_URL,
site https://survive-sunday.vercel.app.
Never commit secrets. Watch for AUTH_SECRET missing, AUTH_TRUST_HOST,
and AUTH_URL set to example.com or localhost (app ignores those at runtime; still delete them).
Small PR only if code must change; otherwise give click-by-click Vercel steps.
My problem: [paste Type error / deploy log snippet / login error — no secrets]
```

#### e) PWA install help for friends

```
You are helping the Survive Sunday owner explain phone install to friends.
Read docs/HANDOFF.md and:
- public/manifest.webmanifest
- public/sw.js
- src/app/layout.tsx
- the “Install the app” section in src/components/HelpContent.tsx

Give iPhone Safari and Android Chrome steps for Add to Home Screen.
Mention they should stay logged in via the normal sign-in cookie; if the icon
opens a logged-out screen, sign in once inside the installed app.
Do not change code unless I ask. No extras.
My problem: [e.g. iPhone friends cannot find Add to Home Screen]
```

---

## 10. Tiny glossary

| Word | Meaning |
|------|---------|
| **PR / pull request** | A proposed change on GitHub. Merge it to `main` to go live. |
| **Merge** | Accept the PR so Vercel can deploy. |
| **Redeploy** | Rebuild the same code with the latest env vars. |
| **Lock** | Pick deadline: first kickoff (unless overridden). |
| **PWA** | Website you can pin to the phone home screen. |
| **Neon** | The hosted database. |
| **Vercel** | The company that hosts the website. |
| **Audit log** | A written record of commissioner changes (imports, removals). |

---

*If you update the app, update this file in the same PR so the next free chat stays accurate.*
