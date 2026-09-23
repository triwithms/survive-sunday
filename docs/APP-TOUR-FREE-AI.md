# Free-AI prompt — Survive Sunday tour voice-over

**Fire when:** Optional. Game-sheet Share / Schedule **Details ›** / centred My pick **Game details ›** are on `main` ([#148](https://github.com/triwithms/survive-sunday/pull/148) merged). Use when Robert wants funnier announcer lines for the recording checklists.

**Who:** free Grok → free Claude → free Gemini. **Copy only — no code, no Help UI, no app PR.**

**Before pasting:** Re-read [`FREE-AI-QUEUE.md`](FREE-AI-QUEUE.md) safety steps. Open [`APP-TOUR.md`](APP-TOUR.md) on `main` and punch up **that** script. If the UI has moved, fix APP-TOUR.md first (or stop and say so) — do not invent taps.

---

## Product notes (do not implement)

- These tours are **recording checklists**, not in-app coach marks.
- **Quick** is an immersive Apple-style **live demo** (viewer is a player; questions drive taps). **Full** is the comprehensive feature pass — do not rewrite Full into the Quick POV.
- **When the Quick tour and Full demo videos exist**, two video links belong **near the top of Help** (not buried in a topic). Help is the friend-facing home for those links. Until then, docs only — **do not** write HelpContent or reserve UI in this pass. Those links can mention **closed captions**.
- Captions on the recordings: **closed captions** (toggle on/off via sidecar/VTT or host CC). Do not assume captions are burned into the frame. Do not write a Join/Sign-in tour in this pass (Phase 2).
- Say **Admin** / **Administrator** only. Never Commissioner.

---

## Prompt (copy from here)

Punch up **only** the Survive Sunday **Quick tour** and **Full demo** voice-over scripts.

### Read first
https://github.com/triwithms/survive-sunday/blob/main/docs/APP-TOUR.md

That file is the source of truth for **steps and order**. Keep every step, in that order. Do not add screens, do not drop Admin from Full, do not add Admin to Quick, do not invent extra bottom tabs.

### Job
Rewrite the **Voice-over (source draft)** lines so they are funnier and more emotional, still a **generic excited sports announcer** talking to friends on WhatsApp — with **two different jobs**:

- **Quick:** immersive Apple-style **live demo**. Viewer is a **player in the pool**. Questions drive the lines (what’s the score? who’s hurt / starting? what’s my pick?). Sparse. Present tense. Do **not** narrate tab names like a manual. Do **not** turn Quick into Full.
- **Full:** comprehensive **feature pass**. Naming screens is fine. Do **not** rewrite Full into the Quick first-person live-demo POV.

### Tone
- Canadian English (`en-CA`): centred, favourite, colour
- Funny, warm, light roast OK — not mean, no real-life/health jokes
- Generic announcer energy (crowd, kickoff, “the chat is losing it”)
- **Quick** feels in-the-moment on a live / relevant game; **Full** can teach.
- **Do NOT** clone John Madden or any real named announcer / celebrity. No “doink,” no trademark catchphrases, no “this is [famous person].” Invented booth character is fine if it stays generic.
- Nicknames only if they already appear in APP-TOUR.md (they mostly should not). No emails, phones, passwords, invite codes.

### Keep fixed
- **No duration cap.** Quick and Full run as long as a natural pass takes. Do not squeeze lines to hit 60–90 seconds or 3–5 minutes. A shorter WhatsApp cut is an **edit**, not a VO constraint. (Soft: Quick often lands shorter than Full.)
- Quick stays sparser than Full (player-POV questions, not a labelled feature list)
- Full stays punchy; do not write an essay per step
- Button names and screen names exactly as APP-TOUR.md: **My pick**, **Selections**, **Leaderboard**, **Scores**, **Schedule**, **Standings**, **Game details ›**, **Details ›**, **Share**, **Copy**, **Send**, **Close**, **Account**, **Help** (**?**), **YOU’RE OUT**, **Season-end tiebreak**, Admin tabs **Players · This Week · Pool**
- Header Share = this **page**. Sheet Share = this **matchup**. Installed app has **no address bar**.
- Help video links: you may keep the one line that *when videos exist* they sit at the **top of Help**. Those links can mention CC. Do not invent URLs. Do not spec Help UI.
- Captions are closed (toggle on/off). Do not write VO that tells the editor to burn text into the video.

### Out of scope
App code, coach marks, HelpContent, HANDOFF rewrites, pick-backup docs, Join/Sign-in tour (Phase 2), new features.

### Output format (exactly)

```
## Quick VO
1. …
2. …
(same step count as APP-TOUR.md Quick)

## Full VO
1. …
2. …
(same step count as APP-TOUR.md Full)

## Notes
(anything you refused to invent, or a line that is too long to speak — length is not a cap)
```

Paste-ready. No preamble about being an AI.
