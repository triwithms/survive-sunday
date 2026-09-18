# Free AI first / maintenance brief

**Free AI first** (not Grok-only): **free Grok → free Claude → free Gemini**, then paid agents only for the actual code PR/merge.

Filename stays `docs/FREE-GROK.md` so existing links keep working.

## Agent cost / how to work

**#1 cost rule:** For specs, FILE-MAP lookups, QA critic scoring, copy, and checklists, use free tiers in order — **free Grok, then free Claude, then free Gemini** — before any paid Grok Bot / Cursor coding agents. Paid agents only for the actual code PR/merge. Aim to save ~30–50% usage by keeping planning and critic loops off paid runs.

**Docs freshness:** Before free usage runs out on each free tier (Grok, then Claude, then Gemini), update documentation with the changes just made (HANDOFF, FREE-GROK.md, FILE-MAP pointers; Help only if a user/admin process changed). Do this while still on that free tier so the next free chat (or the next model in the cascade) starts from current docs — do not wait until free quota is gone.

This brief is for **free** chats in that order. It is **not** paid Grok Bot, Cursor desktop agents, or other expensive coding bots.

## Where to look (paste these, not the whole repo)

- Keep-up + copy-paste starter prompts: [`docs/HANDOFF.md`](HANDOFF.md) **section 12**
- Targeted file paths: [`docs/FILE-MAP.md`](FILE-MAP.md)
- What each screen is for: [`docs/HOW-SCREENS-WORK.md`](HOW-SCREENS-WORK.md)
- Deploy / env / production-build rules: [`DEPLOY.md`](../DEPLOY.md)

Trust GitHub **`main`** for what friends see today. Never paste secrets.

## How to work

1. Specs, FILE-MAP lookups, QA critic scoring, copy, and checklists stay on **free** tiers in order: Grok, then Claude, then Gemini.
2. Open a **new chat per topic**. Do not reuse a long “everything” thread.
3. Prefer **one small PR per chat**. Continue an existing open PR branch when work is already in flight.
4. Owner is **not a coder** — click-by-click GitHub / Vercel / Admin steps, not “run this locally.”
5. Do not rewrite HANDOFF or Help on every small PR. Update those at most once per day or at the end of a batch.
6. Paid Grok Bot / Cursor coding agents: **actual code PR / merge only**, after free Grok, then free Claude, then free Gemini are exhausted (or unsuitable).

Starter prompts: HANDOFF section 12.
