# Survive Sunday — recording tours

Re-runnable **demo checklists** for screen recording. Not live in-app coach marks. Not a product tour that ships in the app.

**This script is the source of truth.** When the UI changes, re-record against this file (and update the steps here first). Names match [`HOW-SCREENS-WORK.md`](HOW-SCREENS-WORK.md) and [`FILE-MAP.md`](FILE-MAP.md): **My pick · Selections · Leaderboard · Scores · Schedule · Standings**. Header has **Share** + **?** (Help) + **Account**. Say **Admin** / **Administrator** only — never Commissioner.

Canadian English. Audience: friends on WhatsApp.

Punch-up for voice-over lines only: [`APP-TOUR-FREE-AI.md`](APP-TOUR-FREE-AI.md).

---

## When the videos exist (Help)

After the **Quick tour** and **Full demo** videos are recorded, put **two video links near the top of Help** — not buried inside a Help topic. Help is the friend-facing home for those links.

Until the videos exist, this is a **docs note only**. Do not change Help screens or app code just to reserve a spot. When those links exist, they can mention **closed captions** (toggle on/off).

---

## Two tours

| Tour | Length | What it is |
|------|--------|------------|
| **Quick** | ~60–90 seconds | Immersive Apple-style **live demo**. Viewer is a **player in the pool**. Questions drive taps — not a manual. |
| **Full** | ~3–5 minutes | Comprehensive **feature pass** (screens, Share, Help, light Admin). Do not film Full in the same first-person POV. |

Keep tap ripples and highlights if your recorder offers them. They help. Captions: see **Recording notes** — closed captions, not burned in by default.

---

## Recording notes

- **Phone, portrait.** Prefer the **Home Screen** icon (NFL Pool) so header **Share** makes sense — the installed app has no address bar.
- Sign in as a player who is **still in**. If you are out, My pick is a huge **YOU’RE OUT** cover (show that in Full if you can; skip it in Quick).
- You do **not** need to submit a new pick on camera. If you already picked, show the cards and **Game details ›**. Do not mess with a friend’s pick.
- **Quick filming:** prefer **live or relevant game context** (your pick’s matchup, a game that’s on). The viewer should feel like they are *in* the pool this week — not watching a labelled tour of tabs.
- Voice-over: generic **excited sports-announcer** energy — funny, a bit emotional, group-chat. **Not** a real celebrity voice clone. No Madden. No named-announcer imitation. **Quick** is in-the-moment (you’re the player). **Full** can name screens; it is the feature pass.
- **Captions:** use **closed captions** (friends can toggle them on/off) via a sidecar file (WebVTT / `.vtt`) or the host’s CC track. **Do not** burn captions into the picture by default. An optional separate silent burn-in cut can come later if a chat app strips CC. When Help video links exist, they can mention CC.
- Do not invent extra bottom tabs. Do not deep-dive Admin on Quick. On Full, Admin is a wave, not a training video.
- Re-run this whole script when the UI changes.

### Don’t mix these up (on camera)

| This | Is not that |
|------|-------------|
| **Leaderboard** (`/standings`) | Pool in/out **season race** |
| **Standings** (`/nfl`) | NFL win-loss research |
| **Selections** (`/pool`) | Everyone’s **weekly** picks (after lock) |
| Header **Share** / sheet **Share** | Short-lived **link** panel (full URL, Copy, Send) |
| Press-and-hold title / triple-tap week | **Picture** share of Leaderboard or Scores — different gesture; skip unless you have time in Full |

---

## Per-screen features (journey order)

How people actually use the app — not an importance ranking. UI after merged [#148](https://github.com/triwithms/survive-sunday/pull/148).

### My pick (`/pick`)

You land here after Sign in. This is “what am I riding this week?”

- Eligible teams sit on **matchup cards** (away @ home).
- **Pick** is on **each team**. Tapping the card does not open Details.
- Centred **Game details ›** under the matchup header (middle of the card, not on each team). Same game sheet as Scores.
- Sheet **Share** sits beside **Close**.
- Logos still open team pages.
- Change your pick until **your** kickoff (if the new game has not started). No slate-wide countdown.
- If you are **out** for the season: huge **YOU’RE OUT** overlay. Pick controls off. Bottom nav still works.
- Header **Week N** is the **pool** week (read-only). Your personal next-pick week can differ.

### Schedule (`/schedule`)

Browse the slate — including **future** weeks (Scores will not).

- Opens on your current pick week. Past and future weeks are here.
- Gold **Details ›** on rows. Same game sheet as Scores (Share in the sheet header).
- Team names still open research.

### Scores (`/scores`)

This week’s scoreboard (your current pick week). Not a season browser.

- Gold **Details ›** on a game. Same sheet: preview before kickoff, highlights after; **Participants’ picks** after lock.
- Share the matchup URL `{origin}/scores?week={N}&game={gameId}` from the **sheet Share** (and you can still use header Share for the Scores page itself).
- Opening that link selects that week when Scores allows it and opens that game’s sheet.

### Share (header + sheet)

Not a screen — a short-lived panel.

- Header **Share** (square with an arrow, beside **?**) = **this page’s** link.
- Sheet **Share** (beside Close on game details) = **that matchup’s** link.
- Panel shows the **full URL**, **Copy**, and **Send** (Web Share when the phone offers it).
- No permanent address bar in the installed app — that is why the URL is on the panel.
- Hidden on Admin and Account/settings.

### Selections (`/pool`)

The group’s weekly picks. Not the season race.

- Opens on your current pick week. You can look back. Future weeks stay on Schedule.
- Flat list: same team together, then nickname A–Z.
- Before lock: other friends stay hidden.

### Leaderboard (`/standings`)

Pool **season race**. Not NFL W-L. No week chip.

- Still in, then out; then fewest losses / most weeks survived (mulligan).
- Among equals: clean record, live win margin of finished picks, nickname.
- **Season-end tiebreak** sits behind a tap at the bottom (starts collapsed).

### Standings (`/nfl`)

NFL win-loss research. Not the pool Leaderboard.

- Tap a team for the team page.
- A line on this screen links to the pool Leaderboard.

### Account (top right)

Opens **Settings** (`/account`).

- Notification preferences, pick backup, install, Help, report a bug or idea, sign out.
- Administrators also see **Admin** / **Playing as …** here.
- Header Share is hidden on this screen.

### Help (header **?**)

`/help` is a **topic menu**, not a stacked wall of text.

- Tap one topic (or a hash) to see only that section + **Back to Help topics**.
- Topics include Install, Sign in, Making / changing a pick, The tabs, Rules, Account, For Administrators.
- **When the Quick + Full videos exist:** two links near the **top** of Help (see above). Not inside a topic.

### Admin (Full tour only)

Bottom-nav **Admin** for Administrators. Three phone tabs: **Users · Pool · System**. Wave at them. Do not teach every control on camera.

---

## Quick tour (~60–90 seconds)

Immersive Apple-style **live demo**. The viewer is a **player in the pool**, not someone reading a manual. Do not parade every tab. Do not narrate “this is the Scores screen.” Let **questions** drive the taps.

Skip Admin, Standings, Account, Help, and Share unless a question honestly leads there (Full covers those). Skip Selections / Leaderboard — those are the feature pass.

**Film with live or relevant games when you can** (your pick’s matchup; a game that’s on). If nothing is live, still use this week’s real slate — not a fake walkthrough of empty chrome.

Questions, in this order: **What’s the score? Who’s hurt / who’s starting? What’s my pick?**

### Steps (click intents)

UI after [#148](https://github.com/triwithms/survive-sunday/pull/148). Keep the taps honest even if VO stays sparse.

1. **Already signed in.** Open from the Home Screen if you can. Cut to **Scores** on your current pick week. Find the relevant game (the one you picked, or the one you’re about to).
2. **What’s the score?** Tap gold **Details ›** on that game card. Peek the sheet (live, preview, or highlights). Don’t tour every clip.
3. **Close** the sheet. **Who’s hurt / who’s starting?** Tap that team’s **logo or name** (Scores card — logos still open research). Glance injuries / starters. Don’t open every Look closer page.
4. **Bottom nav → My pick.** **What’s my pick?** Scroll to that matchup card (away @ home). **Pick** sits on each team — don’t need to confirm a new pick on camera.
5. One more look if you have seconds: centred **Game details ›** under the matchup header (middle of the card, not on a team). Same sheet as Scores. **Close** lands you back on My pick. Hold on the pick. End.

If you are already locked on a team, still do steps 4–5 — live with the pick; don’t unpick for the video.

### Voice-over (source draft)

Sparse. Present tense. You’re in it. Punch up later with [`APP-TOUR-FREE-AI.md`](APP-TOUR-FREE-AI.md). Keep this order. Do not turn these lines into a labelled feature list.

1. “Sunday. You’re in. What’s the score?”
2. “There it is. **Details.**”
3. “Okay — who’s actually starting? Who’s hurt?”
4. “That’s enough. What’s my pick?”
5. “Matchup card. **Game details** in the middle if you need one more look. **Pick** lives on the team. That’s yours. Ride it.”

---

## Full demo (~3–5 minutes)

Comprehensive **feature pass**. Name the screens. Show Share, Selections, Leaderboard, Schedule, Standings, Account, Help, and a polite Admin wave. **Do not** rewrite this as the Quick live-demo POV — friends who want every control watch Full.

### Steps (click intents)

1. **My pick.** Header + bottom nav. Scroll matchup cards. Point at **Pick** on a team.
2. **Lock rule (say it, don’t wait for kickoff):** you can change until *your* game starts; next week opens for you then — not after Monday Night Football.
3. **OUT (only if you can show it, or say it):** eliminated players get a huge **YOU’RE OUT** cover; picks off; nav still works.
4. **Tap centred Game details ›.** Peek preview or highlights. Logos still go to team pages — don’t follow a logo unless you have time.
5. **Sheet Share** beside Close → full matchup URL, Copy / Send → close panel → **Close** sheet.
6. **Header Share** on My pick → same panel, but this time it is the **page** link, not the matchup. Close it.
7. **Bottom nav → Schedule.** Flip a week if you can (future weeks live here). Tap gold **Details ›** on a row. Same sheet. Close.
8. **Bottom nav → Scores.** Tap **Details ›**. Mention the share link looks like `/scores?week=N&game=…`. Sheet Share once. If it is after lock, glance at **Participants’ picks**. Close.
9. **Bottom nav → Selections.** Same-team clusters, then nicknames. Before lock, other friends stay hidden.
10. **Bottom nav → Leaderboard.** Still in / out. Scroll to **Season-end tiebreak** and tap it open, then collapse.
11. **Bottom nav → Standings.** NFL W-L. Optional: tap a team, see the research page, go back. Point at the line that leads to the pool Leaderboard if it is on screen.
12. **Header Account** (top right). Glance: notification preferences, pick backup, Help, report a bug or idea, sign out. Do not sign out on camera.
13. **Header ? → Help.** Topic menu. Tap one topic (The tabs is a good demo), then **Back to Help topics**. Mention: when the videos exist, two links will sit **near the top of Help**.
14. **Admin (Administrators only).** Bottom nav **Admin**. Show the three tabs **Users · Pool · System**. Do not open every tool. Back to My pick.

Optional extra (only if time): on Leaderboard or Scores, press-and-hold the title (or triple-tap the week on Scores) for **picture** share — say it is different from header Share.

### Voice-over (source draft)

Punch up later with [`APP-TOUR-FREE-AI.md`](APP-TOUR-FREE-AI.md). Keep this order.

1. “Welcome to Survive Sunday — private pool, friends only. You land on **My pick**. Matchup cards. **Pick** on the team. **Game details** in the middle.”
2. “You can change until *your* kickoff. When that game starts, next week opens for you. We do not wait for Monday Night Football.”
3. “If you’re eliminated, this whole screen becomes **YOU’RE OUT**. No more picks. You can still watch the chaos on the other tabs.”
4. “**Game details** — same sheet as Scores. Preview before kickoff, highlights after. Close brings you right back to the pick.”
5. “Sheet **Share** is beside Close. That’s the matchup link for the group chat.”
6. “Header **Share** is the page you’re on. Same panel: full URL, Copy, Send. No address bar on the Home Screen icon — that’s why we show the link.”
7. “**Schedule** is the whole slate. Future weeks live here. Gold **Details** — same sheet again.”
8. “**Scores** is *this* pick week. **Details**, then Share, and the link looks like Scores, week, and game. After lock you’ll see who picked whom.”
9. “**Selections** is the weekly pick list. Same team together, then nicknames. Not the season race.”
10. “**Leaderboard** *is* the season race. Still in, then out. Tiebreak at the bottom starts folded — tap it if you like rules.”
11. “**Standings** — that’s NFL win-loss. Research. Tap a club if you want the helmet and the rest. The pool race stays on Leaderboard.”
12. “Top right is **Account**. Notices, pick backup, Help, report a bug. Administrators switch Playing as / Admin tools here.”
13. “Header **question mark** is Help. Topic menu. One topic at a time. When we have the tour videos, two links will sit right at the top of Help — not buried.”
14. “Administrators get **Admin**: Users, Pool, System. That’s the office. Friends don’t need it on Sunday. Back to My pick — go win a week.”

---

## After you record

1. Save the Quick file and the Full file somewhere Robert can find them, plus a **CC sidecar** (VTT) or host CC track — not a burned-in default.
2. When both exist, a later **Help** change can add the two links at the **top** of Help (separate PR — not this docs file). Those links can mention CC.
3. If the app UI moved, update **this** script first, then re-record. Do not “fix it in the edit” forever.

---

## Future / Phase 2 — Join / Sign-in tour

**Not in scope** for the first Quick and Full in-app tours.

A separate short video for **WhatsApp invites**: invite link → claim the seat → set a password → optional Add to Home Screen → first pick. Same pattern as above: write the script here (or a sibling doc) → record → **closed captions** (sidecar/VTT or host CC, not burned in by default).

Do not fold Join / Sign-in into Quick or Full. Those two stay signed-in, in-app.
