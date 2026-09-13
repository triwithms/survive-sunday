# Survive Sunday — Wave 1

Private NFL survivor / elimination pool PWA for the **2026/27** season.  
Locale: **en-CA**. Stack: Next.js App Router, Prisma + **Neon Postgres** (production), Auth.js (credentials + optional Google).

## Owner / keep-up

Not a coder? Start with **[docs/HANDOFF.md](docs/HANDOFF.md)** — what is **live on `main`** vs still in an open PR, where the app lives (GitHub + Vercel + Neon), login / `AUTH_SECRET` / `AUTH_URL` pitfalls, BM Boys roster names, official Week 1 picks, and copy-paste prompts for **free Grok or a basic paid Grok / xAI chat**. That is **not** paid Grok Bot, Cursor desktop agents, or other expensive coding bots. You merge GitHub PRs and click through Vercel yourself.

If a chat and the handoff disagree, trust the GitHub **`main`** branch.

## Quick start

```bash
cd /workspace/survive-sunday/app
npm install
npx prisma db push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Or one-shot: `npm run setup && npm run dev`

### Build check

```bash
npm install && npx prisma db push && npm run seed && npm run build
```

## Real mode vs Demo mode (commissioner)

The switch is on **Admin** (gold link, top-right) → **first card: Real mode vs Demo mode**. Two big buttons, phone-friendly.

| Mode | Friends see |
|------|-------------|
| **Real** | Who are you? from the live roster, then Join (own email + password) or Sign in. No “demo” wording. No practice `demo1234` picker. |
| **Demo** | Practice account picker and demo copy (for you to try the app). |

**First real commissioner login:** Admin → **Your commissioner login** → your email + password → sign out → Sign in with that email.

**Go live for Week 1:** tap **Real mode** (pool becomes Week 1; Week 2 sandbox is Demo-only) → save real login → later **Reset pool** if you want a clean board → **Roster** if names need fixing → **Import week picks**. Step-by-step: [`docs/REAL-MODE.md`](docs/REAL-MODE.md).

Live roster names (Long Snapper → John Stilo, Steve → Steve Venerus) are patched on the production database at deploy — seed-only is not enough.

## Demo login

Shown only while the pool is in **Demo mode**. Hidden in Real mode.

| Account | Email | Password |
|---------|-------|----------|
| Gams (default / Robert) | `gams@survivesunday.demo` | `demo1234` |
| Black Cobra | `black-cobra@survivesunday.demo` | `demo1234` |
| Cannoli Stuffer | `cannoli-stuffer@survivesunday.demo` | `demo1234` |
| …other BM Boys (see DemoEnter) | `slug@survivesunday.demo` | `demo1234` |
| Steve | `steve@survivesunday.demo` | `demo1234` |
| **Commissioner** | `admin@survivesunday.demo` | `demo1234` |

- Invite code: **`SUNDAY26`**
- Landing (Demo mode) → **Enter as selected** (account picker). Commissioner and invite-code join are secondary.
- Landing (Real mode) → **Who are you?** from the Admin roster (nickname + real name). Friends then set their own email and password to claim that seat. Already-claimed seats point them to Sign in. This is **not** the `demo1234` picker.

## Google auth (optional)

Set in `.env`:

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Demo credentials work without Google keys.

## Forgot password (email or text)

Friends stay signed in on their phone / Home Screen app. We do **not** ask for a code at every login.

If they forget the password: **Sign in → Forgot password** → 6-digit code by email (or SMS if a cell is saved) → new password → signed back in.

- Demo `@survivesunday.demo` seats always use **demo1234** (no reset).
- Production minimum: **`RESEND_API_KEY`** and **`RESEND_FROM_EMAIL`** (see `DEPLOY.md` §3b). Optional Twilio for texts.
- Locally, if those keys are missing, the code is printed in the server log and shown on the reset page.

## Wave 1 features

- Invite code join + live-roster **Who are you?** claim (own email/password on an existing seat) + credentials/demo login + Google-ready Auth.js
- Forgot-password one-time code (email / SMS); sessions stay signed in (~90 days)
- Nickname + optional real name; pool membership; admin/member roles
- Week 1 schedule from `data/week1-slate.json` (real 2026 slate + final scores where present)
- Lock at first kickoff; countdown; hide others’ picks until lock
- One pick/week; no team reuse; bye teams disabled
- Mulligan auto-burn → `one_loss`; second loss → `eliminated`
- Participants list sorted undefeated → one_loss → eliminated, nickname A–Z
- Own pick always visible; after lock show matchup + choice; spreads on pick UI
- Live ESPN scores (poll ~45s while games are on) + auto-grade finals; admin simulate button
- Near-live ESPN injury report on team pages and pick-adjacent chips (Out / Doubtful / Questionable)
- Light admin: lock override, remove player, force grade, **audit log**
- **Import Week picks** (CSV / paste) for groups mid-season — counts for grading/mulligan/reuse
- Season-end tiebreak helpers (fewest losses → weeks survived → nickname A–Z)
- `/help` from HELP-COPY (+ importing prior picks); footer disclaimer
- Dark stadium UI (gold/green); installable PWA shell
- Seed via `npm run seed`

### Import prior picks (commissioner)

Week 1 may already be in progress. As **admin@survivesunday.demo**:

1. Open **Admin → Import week picks**
2. Upload or paste CSV (`nickname,team`)
3. Example: [`public/examples/week1-picks-import.csv`](public/examples/week1-picks-import.csv)
4. Picks are marked `source: imported`, audited, visible post-lock, and auto-graded if games are final


## Fixed QA issues

Wave 1 Pool QA (critical):

1. **Natural lock applies missed picks** — `ensureWeekLockedEffects(weekId)` runs on pool, picks API, standings, scores, and import. When `now >= lockAt` (or week is locked/graded), it applies missed-pick losses once and auto-grades FINAL games.
2. **Missed picks are idempotent** — each no-pick member gets a `source: missed` pick (`teamAbbr: MISS`) + `week.missedPicksAppliedAt`. Lock now then Force grade will not double-loss. `role === "admin"` (Commissioner) is skipped.
3. **Re-import won’t re-burn** — if an imported pick’s team is unchanged and already graded, membership status is left alone (no second mulligan / weeksSurvived bump). Team changes undo the prior grade effect once, then apply the new result.
4. **usedTeamsJson on change-before-lock** — rebuilt from prior-week picks + current pick only (frees KC when changing KC→BUF). Same rebuild on import updates.
5. **Import preview** — Preview matches resolves nickname→team (nickname first, then email) before Confirm import.
6. **Auto-grade on load** — scores/pool (and other ensure paths) grade pending picks whose games are FINAL.
7. **App Router error boundaries** — `src/app/not-found.tsx`, `error.tsx`, `global-error.tsx`, and `(app)/error.tsx` so a reload on `/admin` or `/help` no longer 404/500 with “missing required error components”.
8. **Commissioner session on localhost** — `AUTH_URL=http://localhost:3000`, `AUTH_TRUST_HOST=true`, `trustHost: true`, Secure cookies only on https. Demo `admin@survivesunday.demo` / `demo1234` keeps admin membership for `/admin` and `/admin/import`.
8b. **Tunnel login Host** — middleware forwards a public `Host` (e.g. `*.trycloudflare.com`) as `x-forwarded-host` / `x-forwarded-proto`. Auth `callbacks.redirect` and the auth route rewrite any `https://localhost:3000` Location to the request Host. Client `afterAuthNavigate` always uses a relative `/pool`.
9. **Session identity drift** — demo login `signOut`s first, `await getSession()` before navigate, then hard-loads `/pool`. Authenticated routes are `force-dynamic` + `revalidate = 0`; BottomNav prefetch is off; SW is network-only for HTML/RSC. `SessionProvider` remounts on user id (`refetchOnWindowFocus`, `refetchInterval={60}`).
10. **/pick red “1 Error” toast** — `Countdown` no longer hydrates `Date.now()` from the server; kickoff/logo/undefined guards in `PickClient`.

Server identity check: `node scripts/verify-session-identity.mjs`

## Env

Copy `.env.example` → `.env`. Defaults use SQLite `file:./dev.db`.

```
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```

`AUTH_TRUST_HOST=true` + `trustHost: true` in `src/lib/auth.ts` make Auth.js
use the incoming `Host` / `x-forwarded-host` / `x-forwarded-proto` instead of
pinning `AUTH_URL`. Middleware copies a non-localhost `Host` onto
`x-forwarded-host` so a Cloudflare quick tunnel
(`https://*.trycloudflare.com`) and **http://localhost:3000** share one
`npm run dev`. Auth redirects that still resolve to localhost are rewritten
to the request Host. Session cookies are `Secure` only on https; names stay
`authjs.*` (no `__Secure-` / `__Host-` prefix) so a localhost login still
works after a tunnel visit.

To pin a single origin (OAuth callback, tunnel-only):

```
AUTH_URL=https://great-sloths-fetch.loca.lt
AUTH_TRUST_HOST=false
```

## Wave 2 later (deferred)

- H2H boxing gloves animation
- Weekly + season banter / mute
- SMS (Twilio), digests (Resend), WhatsApp stub
- Notification preference centre (close-game alerts off by default)
- Team detail pages already show ESPN injury report (not demo stubs)
- Full visual polish / motion pass

## Live scores & injuries

**Scores (live):** ESPN’s public NFL scoreboard JSON (`site.web.api.espn.com`, fallback `site.api.espn.com`). No API key. `/scores`, Home, Pick, and Schedule sync on load and poll about every 45s during a live kickoff window. Finals auto-grade picks.

**Injuries (near-live):** same ESPN public injury report JSON. Cached ~12 minutes. Team pages list Out / Doubtful / Questionable / IR / suspension. Pick / Home / Schedule show compact Out·Doubtful·Q chips. This is **not** the official NFL club report and has **no SLA** — ESPN’s undocumented endpoints can 403 or change. `data/sample_injury_news.json` is schema-only and is **not** shown in the UI.

**Not live:** spreads/odds stay seeded; no paid SportsDataIO / API-Sports key is required for Hobby.

See [DEPLOY.md](DEPLOY.md) and [data/data_sources.json](data/data_sources.json).

## Data

Seed JSON lives in `/workspace/survive-sunday/data/` (symlinked as `./data`).

## Disclaimer

For entertainment among friends. Not a gambling service. Spreads/moneylines are informational only.
