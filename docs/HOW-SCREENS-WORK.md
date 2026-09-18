# How the main screens work

Short product cheat sheet for a **non-coder** (or free AI first: Grok → Claude → Gemini). This is **what each screen is for**, not a file dump. Before paid coding agents: free tiers in order — **free Grok, then free Claude, then free Gemini** — + [FILE-MAP](FILE-MAP.md) first (#1 cost rule). See [HANDOFF](HANDOFF.md).

File paths for a targeted fix: [`docs/FILE-MAP.md`](FILE-MAP.md). Keep-up / deploy: [`docs/HANDOFF.md`](HANDOFF.md).

Checked against live bottom nav on `main` (`src/components/BottomNav.tsx`): **Home · Pick · Scores · League · Board · Help**. Do not invent extra tabs.

---

## Names vs URLs (easy mix-ups)

The bar at the **bottom** uses friendly names. The address bar uses different words. A chat that “fixes Home at `/home`” or “opens Board at `/board`” is pointing at the wrong place.

| Tap this (bottom nav) | Opens this URL | Same screen, other names |
|-----------------------|----------------|--------------------------|
| **Home** | `/pool` | Header chip may say **Pool** |
| **Pick** | `/pick` | Header may say **Change pick** / **Make pick** |
| **Scores** | `/scores` | |
| **League** | `/nfl` | NFL win-loss, not the pool board |
| **Board** | `/standings` | Survival standings, not NFL W-L |
| **Help** | `/help` | How-to. Not a pool screen. |

---

## Home (bottom nav)

This is the **pool screen** at `/pool`. After Join or Sign in, you land here.

- Opens on **your current pick week** (the week you still need to pick, or the week whose game is in play for you). You can look back. **Future weeks stay on Schedule** — Home will not open them.
- Big team **logo** for your pick (or a prompt to go make one).
- After lock: **who picked what**, grouped by game. Before lock: other friends stay hidden.
- Files live under `src/components/features/home/` — see [FILE-MAP](FILE-MAP.md) for paths.

---

## Pick

Choose or **confirm one team to win** for the week. Tap a team, then confirm.

- Opens on **your** open week (same idea as Home). Header arrows can flip weeks.
- Used teams and bye-week teams are off the board.
- You can still change until *that team’s* kickoff if the new game has not started.
- Files: `src/components/features/pick/` — [FILE-MAP](FILE-MAP.md).

---

## Scores

Live and final games for **your current pick week** (ESPN). Tap **Details ›** on a card for more. After lock it also lists **Participants’ picks**.

This is **not** a full-season schedule browser. For other weeks’ slates, use header **Schedule** (`/schedule`). Home and Scores will not open a future week.

Files: `src/components/features/scores/` — [FILE-MAP](FILE-MAP.md).

---

## Board

**Survival standings** for the pool: who is undefeated, one-loss, or out. Same friend list order as Home after lock (undefeated first). Not NFL win-loss.

Files: `src/components/features/board/` — [FILE-MAP](FILE-MAP.md).

---

## League

**NFL win-loss standings** (research). Tap a team for the team page. A line on this screen links to the **pool survival board** — that is **Board**, not League.

Files: `src/components/features/league/` — [FILE-MAP](FILE-MAP.md).

---

## Nearby, not bottom nav

These are **header** items. Do not treat them as extra bottom-nav tabs.

- **Schedule** (`/schedule`) — browse the slate by week. Opens on **your current pick week** (same idea as Home / Scores). You can still look at past and **future** weeks here. Use this when Scores is the wrong screen.
- **Videos** (`/videos`) — this season’s YouTube previews / highlights. Opens on **your current pick week** (same idea as Home / Scores). Past weeks stay browsable.
- **Account** (top right) — sign out, notification preferences, pick backup.

Do not invent Admin tabs or admin click-paths in this file. Commissioner tools are a separate topic (`HANDOFF` §8).
