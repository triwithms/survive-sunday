# Chief of Staff — bare takeover

**For:** a new CoS (or human) after a freeze. **Not** the full product bible — that is HANDOFF + FILE-MAP, refreshed when things change.

**Owner:** Robert Gama · **App:** https://survive-sunday.vercel.app · **Login:** /login · **Shortcut:** NFL Pool  
**Repo:** https://github.com/triwithms/survive-sunday  
**Updated:** 2026-09-19 (America/Toronto)

Do **not** ask Robert for chat screenshots.

---

## 1. Read next (full docs)

1. [HANDOFF.md](./HANDOFF.md) — standing rules + keep-up guide  
2. [FILE-MAP.md](./FILE-MAP.md) — screen → files (≤100-line edits)  
3. [FREE-AI-START-HERE.md](./FREE-AI-START-HERE.md) + [FREE-AI-QUEUE.md](./FREE-AI-QUEUE.md)  
4. Open PRs: https://github.com/triwithms/survive-sunday/pulls  

---

## 2. Bare essentials

| Rule | Detail |
|------|--------|
| Cost | Free Grok → Claude → Gemini for specs/copy/critics/docs. Paid Cursor agents **only** for code PRs. |
| Merge/deploy | CoS finishes merges/deploys. Robert only refreshes/tests when told. |
| Edits | ≤100 lines; use FILE-MAP; Canadian English; say **Admin**, never Commissioner. |
| DB safety | Never put `ensure-production-db` / `db push` / seeds on Vercel build. |
| Specialists | Safety/DB, Docs Sync, Codebase Audit, QA — **on CoS assignment only**. |

---

## 3. First 10 minutes

1. Hello Robert; say you read this + HANDOFF.  
2. List open PRs. Respect holds (as of 2026-09-19: **#132 team schedule = HOLD**).  
3. Notifs: if Admin → System → **Send test to me** shows `dry_run`, Production still needs `NOTIFY_MODE=allowlist` + `NOTIFY_ALLOWLIST` before any real send. Never send MNF wrap without his OK.  
4. Do **not** ask friends to delete/re-add Home Screen icons (iOS icon won’t update otherwise).  
5. After a user/admin process change: Docs Sync updates Help + HANDOFF (not every tiny PR).  

---

## 4. When to update *this* file

Only when takeover **procedure** changes (new cost rule, new specialist, new critical env, merge ownership).  
Everyday product/shipped state → update **HANDOFF** / **FILE-MAP**, not this page.
