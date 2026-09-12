# Survive Sunday — Wave 1

Private NFL survivor / elimination pool PWA for the **2026/27** season.  
Locale: **en-CA**. Stack: Next.js App Router, Prisma + **SQLite**, Auth.js (credentials + optional Google).

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

## Demo login

| Account | Email | Password |
|---------|-------|----------|
| Aurora (undefeated) | `aurora@survivesunday.demo` | `demo1234` |
| Frost | `frost@survivesunday.demo` | `demo1234` |
| Ember (one loss) | `ember@survivesunday.demo` | `demo1234` |
| Jasper (no pick) | `jasper@survivesunday.demo` | `demo1234` |
| Harbor (eliminated) | `harbor@survivesunday.demo` | `demo1234` |
| **Commissioner** | `admin@survivesunday.demo` | `demo1234` |

- Invite code: **`SUNDAY26`**
- Landing → **Enter demo pool** switches accounts without signup friction.

## Google auth (optional)

Set in `.env`:

```
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Demo credentials work without Google keys.

## Wave 1 features

- Invite code join + credentials/demo login + Google-ready Auth.js
- Nickname + optional real name; pool membership; admin/member roles
- Week 1 schedule from `data/week1-slate.json` (real 2026 slate + final scores where present)
- Lock at first kickoff; countdown; hide others’ picks until lock
- One pick/week; no team reuse; bye teams disabled
- Mulligan auto-burn → `one_loss`; second loss → `eliminated`
- Participants list sorted undefeated → one_loss → eliminated, nickname A–Z
- Own pick always visible; after lock show matchup + choice; spreads on pick UI
- Live/simulated scores + auto-grade finals; admin simulate button
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

## Env

Copy `.env.example` → `.env`. Defaults use SQLite `file:./dev.db`.

## Wave 2 later (deferred)

- H2H boxing gloves animation
- Weekly + season banter / mute
- SMS (Twilio), digests (Resend), WhatsApp stub
- Notification preference centre (close-game alerts off by default)
- Team detail pages with demo injury badges
- Full visual polish / motion pass

## Data

Seed JSON lives in `/workspace/survive-sunday/data/` (symlinked as `./data`).

## Disclaimer

For entertainment among friends. Not a gambling service. Spreads/moneylines are informational only.
