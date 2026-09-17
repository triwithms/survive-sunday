# File map (targeted fixes)

Point a chat at the **small folder**, not the whole app.

Bottom nav vs URLs (easy to mix up):

- **Home** in the nav is the **pool** screen (`/pool`)
- **Board** is standings (`/standings`)
- **League** is NFL W-L (`/nfl`)

Checked on `main` (`548fdafa`). Do not invent paths.

## Screens

| What you see | Point the chat here |
|--------------|---------------------|
| **Home** (pool) — big pick logo, this week’s games | `src/components/features/home/` — especially `HomePickHero.tsx` (big pick logo), `HomeScreen.tsx`, `load-home.ts`. Also `HomeEmptyPick.tsx`, `HomeGameCluster.tsx`, `build-home.ts`. |
| **Pick** | `src/components/features/pick/` — `PickScreen.tsx`, `load-pick.ts`, `PickMatchupCard.tsx` |
| **Scores** | `src/components/features/scores/` — `ScoresScreen.tsx`, `load-scores.ts`, `ScoreGameCard.tsx` |
| **Board** (standings) | `src/components/features/board/` — `BoardScreen.tsx`, `load-board.ts`, `BoardParticipantRow.tsx` |
| **League** (NFL) | `src/components/features/league/` — `LeagueScreen.tsx`, `load-league.ts` |

## Shared buttons and cards

`src/components/ui/` — `Button.tsx`, `Card.tsx`, `Chip.tsx`, `StatusBadge.tsx`, `index.ts`

## Server actions (save a pick / issue an invite)

| What | File |
|------|------|
| Submit pick | `src/app/actions/submit-pick.ts` |
| Issue invite | `src/app/actions/issue-invite-token.ts` |

## Thin route pages

These files mostly load data and render the folders above. Prefer the feature folder for a visual fix.

| What you see | URL page |
|--------------|----------|
| Home (pool) | `src/app/(app)/pool/page.tsx` |
| Pick | `src/app/(app)/pick/page.tsx` |
| Board (standings) | `src/app/(app)/standings/page.tsx` |
| Scores | `src/app/(app)/scores/page.tsx` |
| League (NFL) | `src/app/(app)/nfl/page.tsx` |

Also exist (same thin-page pattern): Account, Admin, Schedule, Team, Videos.

## CRITICAL — never run these from a Vercel build

| What | Fact |
|------|------|
| Production build | `package.json` → `scripts.build` is **`next build` only**. Never attach `db push`, seed, or `ensure-production-db`. |
| Seed / setup refuse Production | `scripts/assert-not-production.ts` |
| Dangerous one-off DB helper | `scripts/ensure-production-db.ts` (current path; it may move after a hardening PR). **Must never run from a Vercel build.** |
