# Free-AI prompt — Notifications coding brief

**Fire when:** Icons + Admin invite PRs are merged; Account notification prefs are still stubbed / “Coming soon”.

**Before pasting:** Re-read `docs/FREE-AI-QUEUE.md` safety steps; confirm prefs aren’t already live; update FILE-MAP pointers if needed.

---

## Prompt (copy from here)

Write a **coding brief** for Survive Sunday so Account notification preferences become real (not “Coming soon”).

### Goal
Players choose **SMS / Email / both / none**. That choice actually controls outbound messages. Robert approves before noisy production sends.

### Start here
Read `docs/FILE-MAP.md` → Account / notifications / Admin notify paths. Files ≤ 100 lines. Canadian English. Admin / Administrator only (no Commissioner).

### Current (do not redo blindly — verify)
- Account has SMS/Email/both/none UI that may still be disabled / Coming soon
- Resend + Twilio + NotificationSend dedupe already used for some Admin alerts (e.g. password reset, elimination)
- Elimination Admin alerts may intentionally ignore stub prefs — document how player prefs interact once prefs are live

### Required in the brief
1. What each preference means (none = no player marketing/wrap/reminder traffic; Admin-critical alerts? say explicitly)
2. Which events respect prefs (at least: pick reminders if any, MNF wrap later, elim-related player notices if any)
3. Where prefs are stored; enable the Account dropdown for real saves
4. Admin edit of a user’s prefs (visible today but disabled — wire or leave disabled with note)
5. Safe defaults for existing players
6. Dry-run / verify approach without spamming the real pool
7. Out of scope: MNF wrap copy (separate prompt), new marketing blasts

### Output format
Coding brief: Goal / Current / Required / Scope / Out of scope / Acceptance / Manual test steps (phone).
Ready to paste to Chief of Staff for a paid PR.
