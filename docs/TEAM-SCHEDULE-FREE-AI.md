# Free-AI prompt — Team schedule coding brief

**Fire when:** Icons + Admin invite PRs merged (or Robert asks early).

**Before pasting:** Re-read `docs/FREE-AI-QUEUE.md` safety steps; check team page units already shipped (#115/#121); don’t reinvent Offence/Defence pages.

---

## Prompt (copy from here)

Write a **coding brief** for Survive Sunday team pages.

### Goal
From a team page, a clear link opens that team’s **full schedule in order**. Finished games show **scores** and an **obvious win or loss** for that team. Upcoming games stay calm (date/time, opponent) — no TV networks, no injury chips.

### Start here
`docs/FILE-MAP.md` → team / schedule / scores. Prefer `src/app/(app)/team/[abbr]/…` and small feature components. Files ≤ 100 lines. Canadian English.

### Required
1. Entry point on the existing team page (link/button — not a new bottom tab)
2. Ordered list of that team’s games for the season (or remaining + recent — say which)
3. Final games: score + W/L (or win/loss label) for **this** team
4. Live/in-progress: simple status if data exists; don’t break if slate lags
5. Reuse local TeamLogo / schedule cache if present
6. Phone-first; back navigation to the team page

### Out of scope
Pick logic, Admin, notifications, Help rewrite, docs dump.

### Output
Coding brief ready for Chief of Staff / paid PR: Goal / Current / Required / Scope / Out / Acceptance / phone test steps.
