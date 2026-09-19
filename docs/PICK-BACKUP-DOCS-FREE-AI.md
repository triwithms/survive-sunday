# Free-AI prompt — Pick backup + Mulligan vs 💩 docs

**Fire when:** The pick-backup PR is merged (remove copy-from; ranked auto ~5 min; defaults; 💩 rules). Not before.

**Who:** free Grok → free Claude → free Gemini. Docs only — no code.

**Before pasting:** Confirm on `main` that Settings → Pick backup no longer offers copy-from, and auto timing is ~5 minutes.

---

## Prompt (copy from here)

Update Survive Sunday friend-facing Help and owner docs for the new pick-backup rules.

### Product (shipped — do not invent)

1. **Copy from a member is gone.** Only Off and ranked auto (best remaining / highest probability still eligible).
2. **Ranked auto** runs about **5 minutes** before kickoff/lock (not 2). Missing-pick warning can fire earlier.
3. Players can still **change their own pick** in those last 5 minutes. Auto **never** overwrites a pick they already made.
4. Ranked auto stamps **💩**. Official winner must have **zero** 💩 from ranked auto. They can keep picking for fun after 💩 — not eligible to win.
5. **Mulligan** is for people who **made a pick and lost** — not for sleeping through the deadline (that’s 💩 territory).

### Approved copy (use / lightly edit Canadian English; do not name JaJa)

**Rules / Help — Mulligan vs 💩**
The free mulligan is for people who *made a pick and lost*. Bad beat. Still in the fight.

The 💩 stamp is for the ranked auto-pick when you left it too late. You can keep picking every week for fun, hang on the board, roast your friends — you’re just not eligible to win the pool. Laziness has a scent.

You can still change your own pick until your game kicks off. Auto never overwrites a pick you already made.

**Group chat (optional paste for Robert)**
Quick pool note: the free mulligan is for “I picked and got burned.” The 💩 is for “the app had to pick for me.” You can keep playing for fun after a 💩 — you’re just out of the official win race. Make your pick. Don’t make the robot famous.

### Files to touch (verify paths in FILE-MAP)
- Help Rules / Account / pick-backup topics under `src/components/features/help/` + `HelpContent` as needed (≤100 lines/file)
- `docs/HANDOFF.md` — short process note (not a novel)
- `docs/FILE-MAP.md` — one-line pick-backup path if needed
- Say **Admin / Administrator** only — never Commissioner

### Output
PR or patch list: exact snippets for Help + HANDOFF. No app logic changes in this free-AI pass.
