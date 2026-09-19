# MNF weekly wrap — free-AI prompt

**When to use:** After Account notification preferences are live (SMS / Email / both / none actually work). Not before.

**How:** Paste the prompt below into free Claude / Grok / Gemini. Fill in real Week facts. Fact-check the draft. Robert approves before any production email/SMS.

**Update this file** when prefs ship or the wrap process changes.

---

## Prompt (copy from here)

Create a Week N Survive Sunday / NFL Pool weekly wrap message that can be emailed and/or texted to players after Monday Night Football.

### Context
- Private friends pool (BM Boys). Keep it fun, Canadian English, light roasting OK — poke fun without being mean or naming real life/health stuff.
- Recap **one week only** (the week named in the facts). Use the real results pasted below (who picked what, who survived, who went out). If something is missing, say what you need — do **not** invent scores or eliminations.
- Delivery will respect each person’s notification preference: Email only, SMS only, both, or none. Write **TWO** versions from the same facts:
  1. **EMAIL** — a few short paragraphs, subject line included.
  2. **SMS** — under ~320 characters if possible; if it must be longer, split into Part 1/2 cleanly.
- Tone: funny survivor-pool banter, like a friend texting the group chat. Mention **nicknames only** (not emails/phones).
- Do **NOT** include: passwords, invite tokens, Admin tools, or “Commissioner” wording. Say Admin only if needed.
- End each version with one calm line: next week’s picks / change until your own game starts (no hype countdown).

### Output format (exactly)

```
## Email
Subject: …
Body: …

## SMS
…

## Notes
(any facts you assumed or still need)
```

### Facts (paste before writing)

```
---
(WEEK N FACTS GO HERE — nicknames, picks, W/L, who is out)
```

---

## Owner checklist

1. Prefs live in Account (not “Coming soon”).
2. Paste real week facts into the prompt.
3. Free AI drafts email + SMS.
4. Chief of Staff / Robert fact-check.
5. Robert approves → then send (or code the send path).
