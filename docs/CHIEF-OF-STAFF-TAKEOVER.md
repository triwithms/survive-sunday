# Chief of Staff — takeover handoff

**Audience:** a new Grok Bot / Chief of Staff (or human) picking up Survive Sunday after the previous CoS froze.
**Owner:** Robert Gama (`robertgama@gmail.com`, GitHub `triwithms`).
**Live app:** https://survive-sunday.vercel.app  ·  Sign in: https://survive-sunday.vercel.app/login  ·  Shortcut name: **NFL Pool**
**Repo:** https://github.com/triwithms/survive-sunday (public)
**Updated:** 2026-09-19 (America/Toronto)

Do **not** ask Robert to paste chat screenshots. Start here, then read the linked docs.

---

## Read first (order)

1. This file
2. [docs/HANDOFF.md](./HANDOFF.md) — standing product + ops rules
3. [docs/FILE-MAP.md](./FILE-MAP.md) — screen → code paths (≤100-line edits)
4. [docs/FREE-GROK.md](./FREE-GROK.md) + [docs/FREE-AI-QUEUE.md](./FREE-AI-QUEUE.md) + [docs/FREE-AI-START-HERE.md](./FREE-AI-START-HERE.md)
5. Open PRs on GitHub: https://github.com/triwithms/survive-sunday/pulls

---

## How we work (non-negotiable)

| Work | Who |
|------|-----|
| Planning, copy, briefs, QA critic, docs drafts | **Free** Grok → Claude → Gemini first |
| Code PRs / merges / deploys | **Paid** Cursor cloud agents via Chief of Staff |
| Specialist bots (Safety/DB, Docs Sync, Codebase Audit, QA) | On assignment from CoS only |

- **#1 cost rule:** never burn paid agents on specs/copy/docs if free AI can draft the brief.
- **Files ≤ 100 lines** when editing; use FILE-MAP; no giant code dumps in chat.
- **Canadian English.** **Admin / Administrator** only — never Commissioner.
- Robert does **not** merge/deploy himself — CoS finishes PR → merge → Vercel; he only refreshes/tests when told.
- Never reintroduce destructive `ensure-production-db` / `db push` on Vercel build.

---

## Product snapshot (Week 2 pool)

- Six tabs: My pick · Selections · Leaderboard · Scores · Schedule · Standings; Help = header `?`
- Login: email + password only; post-login prompt for missing nickname / full name / cell
- Pick change: until **own** game starts, every week (eligible leftover teams)
- OUT players: huge YOU'RE OUT overlay on My pick; cannot submit (#128)
- Local transparent helmets only (#119/#124/#125); football PWA icons (#127) — **iOS Home Screen icon does not update** without re-add (do not nag friends to delete)
- A2HS: Yes / No / Not now; iOS steps via `A2hsIosHint` (#117)
- Admin: Users / Pool / System; partial profiles + `/login?invite=` prefill (#130); Enter a friend’s pick; **Send test to me**
- Notifications (#133): `User.notifyPref` Email/SMS/both/none; gatekeeper `resolveChannels`; **SECURITY** ignores prefs; **GAME** respects prefs; **ADMIN ALERTS** use each Admin’s own pref
- **NOTIFY_MODE:** `dryrun` | `allowlist` | `live` + `NOTIFY_ALLOWLIST`. Production should use **allowlist** until Robert verifies “Send test to me” shows `sent`, then he flips **live**. If UI shows `email: dry_run`, nothing was emailed — env still dry-run.

---

## Open / held vs done (as of 2026-09-19 morning)

### Open (do not lose)

| PR | Status | Notes |
|----|--------|--------|
| [#132](https://github.com/triwithms/survive-sunday/pull/132) team full-season schedule + scores/W/L | **HOLD** — Robert said hold; merge only when he says go |

### Merged recently (live or deploying)

#133 notifs · #130 invite prefill · #129/#131/#134 free-AI docs · #128 OUT+Admin elim · #127 icons · #126 bottom nav · #125 NE/CLE plates · #124 transparent logos · #122 header Week N · #121 healthy-then-injured · #120 cache · #118 tiebreak collapse · #117 A2HS iOS steps · #115 team units · #108 Help topic menu · …

### Queued (not yet PRs)

1. MNF Week 1 wrap — copy drafted in chat; **do not send** until allowlist test passes; prompt: [MNF-WRAP-FREE-AI.md](./MNF-WRAP-FREE-AI.md)
2. Settings hub
3. Scores ~10 min auto-refresh while live + Refresh button
4. Admin A2HS server tracking (who installed / opted out)
5. Optional later: Email/SMS reinstall guide for new icon (soft feature hold) — **not now**
6. Scrapped: “Update available” PWA banner (cannot fix iOS icon)

---

## Specialist bots (message by role)

| Bot | Focus |
|-----|--------|
| Safety / DB | Production DB, Prisma/Neon, never destructive build |
| Docs Sync | HANDOFF, HelpContent, free-Grok docs |
| Codebase Audit | Modular vs monolithic inventory |
| QA | Live smoke https://survive-sunday.vercel.app |

CoS directs them; they do not freelance.

---

## Routines (Grok Bot)

- **Home Screen invite remind** — weekdays 10:00 America/Toronto
- **Survive Sunday free-AI queue** — on `pr-merged` for this repo; surfaces next free-AI prompt if still valid
- Join-watch routine was **deleted** (Robert asked)

---

## Immediate recovery checklist for a new CoS

1. Say hello to Robert; confirm you read this file + HANDOFF.
2. List open PRs; respect **#132 HOLD**.
3. Ask whether `NOTIFY_MODE` / `NOTIFY_ALLOWLIST` are set on Vercel Production yet.
4. Do not launch paid agents for docs/copy — use free AI + [FREE-AI-START-HERE.md](./FREE-AI-START-HERE.md).
5. After any merge that changes user/admin process, Docs Sync updates Help + HANDOFF.
6. If the box/desktop is broken: point Robert to Update Grok Bot's Computer in app settings — do not invent reset paths.

---

## Week 1 wrap draft (parked — fact-check before send)

Claude drafted Email+SMS (mulligan; 6 clean / 7 burned free pass / 0 out). Prefs note in that draft was stale. Confirm Gdogss/JaJa “weeks survived” vs others before any send. SMS ~302 chars. Owner approval required; respect `NOTIFY_MODE`.

---

## Owner preferences (high signal)

- Rough ETAs as ranges with confidence
- Visibility when work is delegated (cloud-agent cards; say when free AI is used)
- No ASCII flowcharts — Mermaid/professional diagrams only in process docs
- Musk-style: delete before simplify when scoping
- Friends forget passwords — reset must work; Admin can set passwords
