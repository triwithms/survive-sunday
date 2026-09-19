# File map (targeted fixes)

Before paid coding agents: free tiers in order — **free Grok, then free Claude, then free Gemini** — + this map first (#1 cost rule). See [HANDOFF](HANDOFF.md). Free-AI start: [FREE-AI-START-HERE.md](FREE-AI-START-HERE.md). CoS takeover: [CHIEF-OF-STAFF-TAKEOVER.md](CHIEF-OF-STAFF-TAKEOVER.md).

Point a chat at the **small folder**, not the whole app.

What each screen is **for** (product behaviour, not files): [HOW-SCREENS-WORK.md](HOW-SCREENS-WORK.md).

Bottom nav vs URLs (easy to mix up):

- **My pick** is `/pick` (default landing after Sign in)
- **Selections** is the old Home URL (`/pool`) — group weekly picks
- **Leaderboard** is the pool in/out race (`/standings`)
- **Standings** is NFL W-L (`/nfl`)
- Header **?** is Help (`/help`). Videos are not a tab.

Checked on `main` (`66a474b`). Do not invent paths.

## Screens

| What you see | Point the chat here |
|--------------|---------------------|
| **Selections** (group weekly picks) | `src/components/features/home/` — `HomeScreen.tsx`, `SelectionsList.tsx`, `load-home.ts`, `sort-selections.ts`. Old Home hero / game-cluster / videos strip are unused on this screen. |
| **Sign in / Forgot password** | `src/components/features/login/` — `LoginForm.tsx` (email + password + Forgot password only), `ForgotPasswordForm.tsx`, `use-invite-prefill.ts`, `InviteGreeting.tsx`. `/login?invite=` peeks a hashed token via `src/app/api/login/invite/route.ts` + `src/lib/invite-prefill.ts` / `invite-prefill-db.ts` (email + nickname only; no session). Cold open `/` redirects here. |
| **First-run profile** | `src/components/features/profile/` + `src/app/welcome/page.tsx` — after Sign in, ask only for missing nickname / full name / cell, then My pick. |
| **My pick** | `src/components/features/pick/` — `PickScreen.tsx`, `load-pick.ts`, `PickMatchupCard.tsx`, `PickOutOverlay.tsx` (eliminated: near-full **YOU’RE OUT** cover; pick controls off). Server still refuses (`src/app/actions/submit-pick.ts`). |
| **Scores** | `src/components/features/scores/` — `ScoresScreen.tsx`, `load-scores.ts`, `ScoreGameCard.tsx` |
| **Leaderboard** (pool in/out) | `src/components/features/board/` — `BoardScreen.tsx`, `load-board.ts`, `sort-board.ts`, `win-margin.ts`, `BoardParticipantRow.tsx`, `BoardTiebreak.tsx` (season-end explanation collapsed until tapped) |
| **Standings** (NFL W-L) | `src/components/features/league/` — `LeagueScreen.tsx`, `load-league.ts` |
| **Videos** (deep link only) | `src/components/features/videos/` — `VideosScreen.tsx`, `load-videos.ts`. Not a bottom tab; clips also sit in Scores/Schedule Details. |
| **Schedule** | `src/components/features/schedule/` — `ScheduleScreen.tsx`, `load-schedule.ts`. Defaults to the same current pick week as My pick / Selections / Scores; future weeks stay browsable. |
| **Admin** | `src/components/features/admin/` — phone tabs **Users · Pool · System** (`AdminNav.tsx`). `/admin` opens Users. `/admin/comms` redirects to Users. Users: **Add user** (`AddUserForm`) + find/expand roster (`RosterEditor`, `RosterRow`, `UserEditPanel`) — edit nickname / full name / email / cell (`RosterContactFields`); email/cell unique vs another pool member (`src/lib/contact-taken.ts`); set password / copy text / Join; notification preference (`RosterNotifyPref`, same master + per-type channels as Account). No Who-are-you list. No Commissioner person. Pool: mulligan, **Make administrator**, **Hand the pool**. System: **Enter a friend’s pick** for current/past weeks (next week only after that friend’s own game starts + valid pick — `src/lib/enter-pick-week.ts`) plus **Send test to me** (`SendTestNotify`). Reset stays closed. No census / lock / grade / administrator-login panel. Password: `SetMemberPasswordForm.tsx`. Thin pages under `src/app/(app)/admin/`. Live-only (`src/lib/week-isolation.ts`). Join still claims `@survivesunday.demo` seats. |
| **Team research** | `src/components/features/team/` — `TeamScreen.tsx`, `load-team.ts`, unit / injuries / news / **schedule** screens. Thin pages under `src/app/(app)/team/[abbr]/`. Helmet, record, this week, **style** (above coach), coach, then **Look closer** links: Schedule (full season, scores + W/L), Offence / Defence / Special teams (starters-only checkbox; healthy starters first, then injured starters), Injuries (own page), News. No Key players. No full roster dump. |
| **Settings / Account** | `src/components/features/account/` — hub at `/account` (header **Account**). Rows link to notify prefs (`/account/notifications`), pick backup (`/account/mirror`: Off or ranked auto ~5 min before lock; 💩; no copy-from), Help `/help` + `#install`, mailto feedback, Sign out. Playing as / Admin tools stay on the hub. No notify form on the hub. |

Pool board week (header **Week N**, not a player’s next-pick week): `src/lib/pool-current-week.ts` + `pool-current-week-db.ts`. Derives from the slate when `Pool.currentWeek` lags; `ensure-week` cron can persist a forward-only bump.

## Shared buttons and cards

`src/components/ui/` — `Button.tsx`, `Card.tsx`, `Chip.tsx`, `StatusBadge.tsx`, `index.ts`

**Add to Home Screen nudge** (signed-in phones only): `src/components/features/a2hs/` — `A2hsNudge.tsx` asks Yes / No / Not now. Yes = native Install or iOS Safari … → Share □↑ steps (`A2hsIosHint`). No = opt out; Help menu → **Install on Home Screen** (`HelpInstall` + `HelpInstallLink`) reopens Yes. Not now = next Sign in. Icon deleted (`installed` + !standalone) resets to pending. Mounted in `src/app/(app)/layout.tsx`. Shortcut label is **NFL Pool** (`public/manifest.webmanifest` `name` / `short_name`). Home Screen / browser icons: `public/icons/` (PNG `any` 192/512/1024 + `maskable` 192/512 in the centre ~80% safe zone, `apple-touch-icon` 180, SVG source). Favicon: `src/app/favicon.ico` + `public/icons/icon-32.png`, wired in `src/app/layout.tsx`. Rebuild: `node scripts/export-app-icons.mjs`. No NFL marks.

Team logos: `src/components/TeamLogo.tsx` + `src/lib/team-helmets.ts` (`resolveTeamLogoSrc`). **Local-only** transparent helmets at `public/helmets/{abbr}.png` (app abbr, e.g. `was.png`). No white plates. No ESPN CDN / stored `Team.logoUrl` in the UI. Never letter badges. (`src/lib/espn-teams.ts` still has ESPN id helpers; `TeamLogo` ignores `logoUrl`.)

## Server actions (save a pick / issue an invite)

| What | File |
|------|------|
| Submit pick | `src/app/actions/submit-pick.ts` — eliminated players get `403` (“You’re out — no picks”) |
| Admin elim notify | `src/lib/elimination-admin-alert.ts` + `elimination-admin-copy.ts` — after grade / missed-pick / import newly eliminates someone, notify Administrators (same multi-admin union as password-reset). Goes through `dispatchNotice` (`admin_alert`) so each Administrator’s `eliminationMulligan` channel chooses Email / SMS / both / Off (master Off does not skip admin alerts). Dedupe via `NotificationSend` (channel + outcome). |
| Player notices | `src/lib/notify.ts` → `notify-dispatch.ts`. Gatekeeper `resolveChannels` / `planNotice` (`src/lib/notify-channels.ts`, `notify-plan.ts`). Master + per-type channel on `NotificationPreference` (`masterOn`, `channelsJson`: `email` \| `sms` \| `both` \| `off`). Account UI: `features/account/NotificationPrefsForm` + `NotifyMasterToggle` / `NotifyTypeList`. Admin: `RosterNotifyPref` (same model), `POST /api/admin/notify-test`. GAME email + SMS spam tip: `notify-game-footer.ts`. Mode: `NOTIFY_MODE` + `NOTIFY_ALLOWLIST` (`notify-mode.ts`). Production ops: [HANDOFF §4 notification ops](HANDOFF.md#notification-ops-production). Additive columns + v1 defaults: `notify-type-schema.ts`. SECURITY (password reset / sign-in codes via `otp-notify.ts`) ignores prefs and `NOTIFY_MODE`. |
| Issue invite | `src/app/actions/issue-invite-token.ts` — URL is `/login?invite=` (`inviteLoginPath`). Reuses hashed `InviteToken` (14-day TTL). |
| Invite prefill | `src/app/api/login/invite/route.ts` + `src/lib/invite-prefill-db.ts` — peek token, return email + nickname only |
| Add user | `src/app/api/admin/add-user/route.ts` + `src/lib/add-user.ts` — unique email/cell: `src/lib/contact-taken.ts`. Blank email/cell store NULL (`src/lib/user-email-schema.ts`). |
| Save this person | `src/app/api/admin/roster/route.ts` + `src/lib/roster-profile.ts` — same uniqueness helpers |

## Thin route pages

These files mostly load data and render the folders above. Prefer the feature folder for a visual fix.

| What you see | URL page |
|--------------|----------|
| Selections | `src/app/(app)/pool/page.tsx` |
| My pick | `src/app/(app)/pick/page.tsx` |
| Leaderboard | `src/app/(app)/standings/page.tsx` |
| Scores | `src/app/(app)/scores/page.tsx` |
| Standings (NFL) | `src/app/(app)/nfl/page.tsx` |
| Videos | `src/app/(app)/videos/page.tsx` |
| Schedule | `src/app/(app)/schedule/page.tsx` |
| Team research | `src/app/(app)/team/[abbr]/page.tsx` — own pages: `/schedule` `/offence` `/defence` `/special-teams` `/injuries` `/news`. Player detail stays `/team/[abbr]/player/[slug]`. |
| Admin hub | `src/app/(app)/admin/page.tsx` redirects to Users. Tabs: Users `/admin/users`, Pool `/admin/config`, System `/admin/system`. Deep links: `/admin/roster` → Users, `/admin/comms` → Users, `/admin/import` stays. |
| Settings / Account | `src/app/(app)/account/page.tsx` — hub. Notify `/account/notifications`. Pick backup `/account/mirror` (Off / ranked auto ~5 min). Logic: `src/lib/pick-mirror.ts`. Jobs: ensure-week, `/api/cron/pick-backup`, scores sync. |

Also: Sign in `src/app/login/page.tsx`, Forgot password `src/app/login/forgot/page.tsx`. Landing `src/app/page.tsx` redirects to Sign in (or `/welcome` / `/pick` if already signed in). No people-list / Who are you? screen.

Help topics: `src/components/HelpContent.tsx` + `src/components/features/help/` — `/help` is a short topic menu (not a stacked page). Tap a topic or a hash (`#install`, `#account`, …) to see only that section + **Back to Help topics**. **Install on Home Screen** first (`HelpInstall` + `HelpInstallLink` → A2HS Yes; iOS steps via `A2hsIosHint`), then Sign in, Pick, Tabs (`HelpScreens`), Rules (includes Mulligan vs 💩 in `HelpMulligan`), Account, Administrators. Header **?** is Help (`/help`). Each file ≤100 lines. No Wave wall, no notification prefs UI on Help.

## Flagged internals (Commissioner → Admin copy)

Same role. No new role. User-facing copy says **Admin** (screen/nav) or **Administrator** (person). Keep **Hand the pool** / **Make administrator**. These identifiers / seed values were **not** renamed:

- Routes: `/api/admin/commissioner-account`, `/api/admin/transfer-commissioner`
- Components: `CommissionerAccountPanel`, `CommissionerLoginForm`, `CommissionerSignOut`, `TransferCommissionerForm`
- Helpers / keys: `poolHasRealCommissioner`, `hasRealCommissioner`, `CLAIM_ERRORS.commissionerSeat` / `alreadyCommissioner`, `commissionerSeat` vars
- Audit actions: `commissioner_account_set`, `transfer_commissioner`, `newCommissionerStaysOnBoard`
- Demo seed no longer creates a Commissioner person (`demo-account.ts` / `prisma/seed.ts`). Users/Pool people lists hide spectator `role=admin` seats. Gams is Player + Administrator.

## CRITICAL — never run these from a Vercel build

| What | Fact |
|------|------|
| Production build | `package.json` → `scripts.build` is **`next build` only**. Never attach `db push`, seed, or `ensure-production-db`. |
| Seed / setup / db:push refuse Production | `scripts/assert-not-production.ts` — stops those commands from changing the live database. `db:push` / `setup` go through this guard. Emergency only: `ALLOW_PROD_DB_MUTATION=1`. **Vercel is always refused** (even with that break-glass). |
| Dangerous one-off DB helper | Live helper: `scripts/_dangerous/ensure-production-db.ts`. Old `scripts/ensure-production-db.ts` prints “Moved…” and **exits 1**. **Must never run from a Vercel build.** |
| Vercel Functions Storage | `next.config.ts` — keep `serverExternalPackages: ["@prisma/client"]` so the query engine loads (auth CallbackRouteError). Do **not** `outputFileTracingIncludes` the whole `@prisma/client/**` tree on `/*`; that copies every engine + WASM into every function. Include only the RHEL engine on `/api/` (+ instrumentation). Exclude debian engines, WASM, and the Prisma CLI. |

## ESPN last-good cache (slice 1)

TTLs: `src/lib/static-cache-ttl.ts`. **Week slate / kickoffs** — last-good 6h (20s while live or in the kickoff window); refresh on TTL or slate hash change; Scores/Schedule skip ESPN refetch inside TTL (`espn-scoreboard.ts`, `week-espn-refresh.ts`, schedule/scores loaders). Team full-season schedule peeks that last-good week cache and syncs only the current pick week. **Injuries** — last-good 24h, keep the last good list while refresh runs, replace only when the hash changes (`injury-cache.ts`, `live-injuries.ts`). Not frozen: live scores in a live window, picks, leaderboard, auth, Admin writes. Logos are local-only (`public/helmets/{abbr}.png`).
