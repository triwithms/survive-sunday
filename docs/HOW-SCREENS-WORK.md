# How the main screens work

Short product cheat sheet for a **non-coder** (or free AI first: Grok → Claude → Gemini). This is **what each screen is for**, not a file dump. Before paid coding agents: free tiers in order — **free Grok, then free Claude, then free Gemini** — + [FILE-MAP](FILE-MAP.md) first (#1 cost rule). See [HANDOFF](HANDOFF.md).

File paths for a targeted fix: [`docs/FILE-MAP.md`](FILE-MAP.md). Keep-up / deploy: [`docs/HANDOFF.md`](HANDOFF.md).

Checked against live bottom nav (`src/components/BottomNav.tsx`): **My pick · Selections · Leaderboard · Scores · Schedule · Standings**. Header has **Account** + **?** (Help). Do not invent extra tabs. No Home / Pool / Board / League / Videos / Help in the bottom bar.

---

## Names vs URLs (easy mix-ups)

The bar at the **bottom** uses friendly names. The address bar uses different words. A chat that “fixes Home at `/home`” or “opens Board at `/board`” is pointing at the wrong place.

| Tap this (bottom nav) | Opens this URL | Same screen, other names |
|-----------------------|----------------|--------------------------|
| **My pick** | `/pick` | Default landing after Sign in |
| **Selections** | `/pool` | Group weekly picks (old Home URL) |
| **Leaderboard** | `/standings` | Pool in/out race. Not NFL W-L |
| **Scores** | `/scores` | |
| **Schedule** | `/schedule` | On the bottom bar |
| **Standings** | `/nfl` | NFL win-loss. Not the pool Leaderboard |

Header **?** opens Help (`/help`). Videos stay inside game **Details** (Scores / Schedule). `/videos` may still open if bookmarked.

---

## My pick (bottom nav)

Today’s pick screen at `/pick`. After Join or Sign in, you land here.

- Your card plus change / make pick until **your** kickoff. Header shows the week badge only — no slate-wide countdown or “Deadline passed.”
- If you’re **out** for the season, My pick is covered with a huge **YOU’RE OUT** overlay (not a chip). Pick controls are off; the bottom nav still works.
- Opens on **your** open week. The header **Week N** badge is the **pool’s** current week from the slate (read-only) — it can differ from your personal next-pick week. Browse other weeks on **Schedule** or **Scores**.
- Used teams and bye-week teams are off the board.
- Files: `src/components/features/pick/` — [FILE-MAP](FILE-MAP.md).

---

## Selections

Everyone’s picks for the week at `/pool` (old Home URL). Not the in/out race.

- Opens on **your current pick week**. You can look back. **Future weeks stay on Schedule**.
- Flat pick list (same team together, then nickname A–Z). No videos strip. No per-game logo clusters. No yellow Home pills.
- Before lock: other friends stay hidden.
- Files live under `src/components/features/home/` — see [FILE-MAP](FILE-MAP.md).

---

## Leaderboard

**Pool in/out race** at `/standings`: still in, then out; then fewest losses / most weeks survived (mulligan). Among equals: clean record, live win margin of finished picks, nickname. No week chip — season race. Not NFL win-loss. Weekly picks are on **Selections**. Season-end tiebreak sits behind a tap at the bottom.

Files: `src/components/features/board/` — [FILE-MAP](FILE-MAP.md).

---

## Scores

Live and final games for **your current pick week** (ESPN). Tap **Details ›** on a card for more (including clips). After lock it also lists **Participants’ picks**.

This is **not** a full-season schedule browser. Future weeks stay on **Schedule**.

Files: `src/components/features/scores/` — [FILE-MAP](FILE-MAP.md).

---

## Schedule

Browse the slate by week (`/schedule`). Opens on **your current pick week**. You can still look at past and **future** weeks here.

Files: `src/components/features/schedule/` — [FILE-MAP](FILE-MAP.md).

---

## Standings

**NFL win-loss** (research) at `/nfl`. Tap a team for the team page. A line on this screen links to the pool **Leaderboard**.

Files: `src/components/features/league/` — [FILE-MAP](FILE-MAP.md).

---

## Team research

Tap a club from My pick, Schedule, Standings, or Scores. Helmet, record, this week’s matchup, **style**, then coach. **Look closer** opens Schedule (full season with scores and win/loss), Offence / Defence / Special teams (starters-only checkbox; healthy starters first, then injured starters), Injuries, or News. No Key players card. No full roster dump.

Files: `src/components/features/team/` — [FILE-MAP](FILE-MAP.md).

---

## Nearby, not bottom nav

- **Help** (`/help`) — header **?**. Topic menu: tap one topic (or a hash) to see only that section + **Back to Help topics**. How-to. Not a pool screen.
- **Videos** (`/videos`) — leftover deep link. Clips also sit in Scores / Schedule **Details**.
- **Account** (top right) — opens **Settings** (`/account`). Notify prefs, pick backup, install, Help, feedback, sign out.

Do not invent Admin tabs or admin click-paths in this file. Admin tools are a separate topic (`HANDOFF` §8).
