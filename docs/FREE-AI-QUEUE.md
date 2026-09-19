# Survive Sunday — free-AI prompt queue

Chief of Staff (Grok Bot) owns when to surface these. **Never auto-paste a stale prompt into free AI or a paid coding agent without re-reading this file and the linked prompt first.**

**Start-here mega prompt:** [FREE-AI-START-HERE.md](./FREE-AI-START-HERE.md)

## Safety before every fire

1. Open this queue + the linked prompt on **main**.
2. Check prerequisites still true (and the feature isn’t already shipped).
3. Patch the prompt for anything that landed since it was written (FILE-MAP paths, Admin wording, prefs, etc.).
4. Only then: hand the **updated** prompt to free AI, or launch a paid PR from a free-AI brief.
5. If it no longer makes sense → mark **done/cancelled** in the Status column and skip quietly (or tell Robert why).

## Queue (order)

| # | Prompt | Fire when | Status |
|---|--------|-----------|--------|
| 0 | [MNF wrap copy](./MNF-WRAP-FREE-AI.md) · [start block A](./FREE-AI-START-HERE.md) | Notification prefs **live** + Week facts ready | **ready** (prefs shipped #133) |
| 1 | [Notifications coding brief](./NOTIFICATIONS-FREE-AI.md) | Icons + Admin invite merged; prefs still stubbed | **done** (#133) — do not re-run |
| 2 | [Team schedule coding brief](./TEAM-SCHEDULE-FREE-AI.md) | After icons + Admin invite | icons+invite done; paid PR may already be in flight |
| 3 | [Docs refresh](./DOCS-REFRESH-FREE-AI.md) | Free quota available; HANDOFF/FILE-MAP lag | optional anytime |

## Triggers

- **GitHub `pr-merged` on `triwithms/survive-sunday`:** Chief of Staff routine re-checks this queue; if the next item’s prerequisites are met and Status isn’t done, ping Robert with the GitHub link to that prompt (after a quick sanity edit note if needed).
- **Manual:** Robert asks for the next free-AI job.

Paid Cursor agents implement code. Free AI drafts briefs/copy only.
