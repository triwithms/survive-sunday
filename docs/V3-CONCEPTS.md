# Survive Sunday — v3 concepts (planning only)

> Status: planning only. Nothing here is built or live. Today Survive Sunday is one private pool (SUNDAY26), Admin phone tabs Players / This Week / Pool, email + Twilio SMS notifications, Neon Postgres, Vercel.
> Prices are rough, in USD unless marked CAD, checked September 2026. Re-check before any decision.

## Goals

- Let big pools (100+ players) stay readable on a phone and in email: top-X lists plus "where am I" for everyone else.
- Let other people launch their own private pool on the same app, same database, same infra — each pool Admin sees only their pool.
- Cover real costs (hosting, email, SMS, AI/coding tooling) without pretending a $0.99 price does more than it does.
- Keep comms cheap by default: email + Copy/Share. Paid SMS only when someone pays for it.
- Keep SUNDAY26 working unchanged through the move.

## Non-goals (this season / v2 Admin redesign)

- No v3 build during the 2026/27 season. SUNDAY26 stays as is.
- No changes to the v2 Admin redesign scope because of this doc.
- No handling of entry fees, prize money or payouts. Organizers collect money off-platform.
- No native App Store / Play Store apps. Stays a PWA.
- No public pools, matchmaking or strangers joining strangers.
- No unlimited or platform-subsidized SMS.
- No per-pool custom domains, branding or white-label.

## Large-pool display: top-X lists & emails

**Admin setting (per pool):** "Show top X in lists and emails" — options e.g. 10 / 25 / 50 / All. Default: All for pools ≤ 30, 25 above that.

**Behaviour for a viewer inside the top X:** normal list, their row highlighted.

**Behaviour for a viewer outside the top X:**

```
 1. Dave        alive  W1–W4 ✓
 ...
25. Priya       alive
    ··· 11 players between the cut and you ···
37. You (Robert) alive
    ··· 63 more below ···
```

- "N between you and the cut" = your rank − X − 1.
- Optional: show 1 row above and below you for context.
- Emails: same rule, rendered per recipient (each person's email shows their own place). Costs nothing extra with most email APIs; it just means one send per person rather than one BCC blast.
- SMS: never lists. Facts only (e.g. "Wk 5: you're alive, 37th of 100. 62 left.").

**Survivor-specific catch:** survivor standings are mostly alive vs out, so "rank" needs a defined order. Proposal: alive first; then weeks survived; then tiebreaker (Robert to pick — e.g. cumulative margin of picked teams, alphabetical, or join order). Ties share a rank.

**Scales better than lists for big pools:**
- Weekly pick distribution ("KC 34% · DET 21% · 12 other teams"), shown after lock.
- "Alive: 62 of 100 · Eliminated this week: 9".
- Eliminated players collapsed into one count by default.

## Multi-pool: one app, many pools, shared infra

**Data model (concept):**
- `pools` — id, name, invite code (SUNDAY26 becomes pool #1), season, settings (top-X, comms options, deadline rules).
- `memberships` — user_id, pool_id, role (`admin` / `player`), status.
- Every pool-owned row (picks, eliminations, messages, notification log) carries `pool_id`.
- Shared, not per pool: NFL schedule, results, team list. One fetch serves every pool — the main economy of shared infra.
- One user can belong to several pools; a pool switcher appears only if they have more than one.

**Access rules:**
- Pool Admin: sees and edits only pools where their membership role = `admin`.
- Platform owner (Robert): separate super-admin flag; can see all pools for support.
- Every query scoped by `pool_id` from the membership, never from a URL value the user can edit. Consider Postgres row-level security in Neon as a second lock.

**Shared paid providers:** one Neon database, one Vercel project, one email sender domain, one Twilio account/number. Per-pool counters track email and SMS sends so costs can be attributed and capped.

**Launch flow (concept):** sign in → "Create a pool" → name, season rules, invite code → (pay if over the free size) → share invite link.

**Hosting fine print:** Vercel's free Hobby plan is meant for personal, non-commercial use. Charging other organizers likely means moving to Vercel Pro (about USD 20/month per seat). Neon and the email provider also have free tiers with limits (storage, compute, daily send caps). Budget for a paid tier on each once money changes hands.

**Migration:** add `pool_id` to existing rows, backfill SUNDAY26, then turn on the scoping. Do it in the off-season.

## Monetization options (compare)

| Option | Organizer pays | Covers fixed hosting? | Covers SMS? | Effort | Verdict |
|---|---|---|---|---|---|
| A. App seat once | $0.99–$4.99 | Only at volume | No | Low | Weak alone |
| B. Season fee by size | ~$0–$150/season | Yes, at modest volume | Only if priced in | Medium | Best base |
| C. Email free + SMS packs | Pack price | No | Yes, by design | Medium | Good add-on |
| D. Copy/Share first | $0 comms | n/a | Avoids it | Low | Best default |

### A. App seat ~$0.99–$4.99 once

- Through Stripe, a $0.99 charge nets roughly $0.66 after the fixed per-transaction fee (~2.9% + $0.30). App stores would take 15–30% instead, but a PWA avoids them.
- One player's season of 2 texts/week (36 segments) costs about $0.40–$0.60 in Twilio + carrier fees. So a $0.99 seat barely covers that one player's SMS and nothing else.
- $4.99 once per pool: covers roughly one small pool's share of hosting, not SMS.
- **Honest read:** $0.99 cannot fund SMS. It can only work as a "tip jar" or an unlock on top of free email.

### B. Season fee by pool size (like Sunday Survivor)

- Industry norm: small pools free or a flat fee, then per-entry pricing that drops with size. Example (Splash/RunYourPool self-managed NHL survivor, 2026): $15 flat up to 10 entries, then $1.25 → $0.50 per entry by tier. GridironGames: first entry free, then $2.00 → $0.75 per entry.
- Illustrative Survive Sunday tiers (CAD, before tax): free up to 15 players; $15 for 16–30; $30 for 31–60; $60 for 61–120; $120 for 121–250.
- Covers hosting and email comfortably once a handful of pools pay. Does not include SMS unless a pack is bought.
- Needs: Stripe checkout, pool size enforcement, refund policy.

### C. Email free + optional SMS packs (organizer pays)

- A common pattern in small SaaS: SMS is not included; the admin buys credit packs. Examples: YouCanBookMe and Koalendar sell SMS credits at about USD 0.07 each (160 chars); bookitLive sells packs of 100–2,000 that never expire; Operoo lets only administrators buy packs.
- These apps afford SMS by reselling it at roughly 4–6× raw cost, not by subsidizing it.
- Illustrative Survive Sunday pack: 500 texts for CAD $15–20. Raw cost ≈ USD 5.50–8.50 (≈ CAD 7.50–12). Margin covers Stripe fees, failed sends and the phone-number rental.
- Hard rule: sends stop at zero balance, fall back to email. No negative balances.

### D. Copy/Share first (no carrier cost) + optional paid send

- Admin composes the message in-app (week wrap, deadline reminder); buttons: **Copy**, **Share** (phone share sheet), **Email** (opens mail app with BCC list), **WhatsApp** (opens with text pre-filled), **SMS** (opens Messages with text; group recipients where the phone allows).
- The organizer's own phone plan or email sends it — typically free on Canadian unlimited plans. Platform pays $0.
- Also solves consent: people receive messages from someone they know, in a group they already use.
- Trade-offs: manual (Admin must tap send); no automatic deadline reminders; not personalized per player; no delivery tracking.
- Automated email (reminders, week wraps) stays platform-sent because it is nearly free.

## How cheap apps afford SMS (plain English)

- **Every text costs real money.** Twilio charges a Canadian long-code text about USD 0.0079–0.0083 per segment, plus a carrier fee often around USD 0.003–0.009. Call it ~1–1.7 US cents per segment all-in.
- **A "text" can be several segments.** 160 plain characters = 1 segment. Go over, or add one emoji (which switches encoding to a 70-character limit), and it becomes 2–3 segments, each billed.
- **There are fixed costs too.** Phone number rental ~USD 1.15/month. Sending to US numbers needs 10DLC registration (brand + campaign fees, some monthly). Canadian anti-spam rules (CASL) require consent and a working opt-out.
- **So small apps do one of three things:**
  1. Don't offer SMS at all (most pool sites: email + in-app alerts).
  2. Resell it in packs at a markup (booking apps: ~7¢ per credit).
  3. Hand the sending to the user's own phone (Copy/Share, WhatsApp, group texts).
- Nobody sustainable gives unlimited SMS away inside a $1 price.

## Recommendation for Survive Sunday

1. **Default comms = email (automated) + Copy/Share (manual).** SMS off for new pools.
2. **Pricing = Option B** (free up to ~15 players, then a season fee by size), because it matches what organizers already expect and covers fixed hosting.
3. **SMS = Option C add-on only**, prepaid packs, facts-only, ≤160 GSM-7 characters, no emoji, hard stop at zero.
4. **Skip Option A** except maybe as an optional "support the app" tip.
5. **SUNDAY26** keeps Robert-paid SMS as the founder pool; it does not set the rule for other pools.
6. **Top-X lists** ship with multi-pool, since only other people's pools will be big.
7. **Budget honestly:** commercial-tier hosting + email + number ≈ USD 40–60/month while live (~USD 200–300 for a 5-month season, ≈ CAD 275–420). The ~CAD 2,400/yr household telecom savings can cover that plus modest AI/coding tooling — but the ~$1,400 already spent on AI/coding shows tooling, not hosting, is the real cost risk. At ~$1 net per paying player, breaking even on hosting alone needs roughly 200–400 paying players a season. Treat v3 as a hobby that pays its own way, not income.

## Cost estimate sheet (organizer view)

**Assumptions**
- Season = 18 weeks.
- Email: 2–3 emails per player per week (deadline reminder, week wrap, occasional notice) → 36–54 per player per season.
- SMS: 2 texts per player per week, each 1 segment (≤160 GSM-7, no emoji) → 36 segments per player per season.
- SMS all-in cost: USD 0.011–0.017 per segment (Twilio ~0.008 + carrier ~0.003–0.009). Canada and US similar per segment; US adds 10DLC registration fees.
- Email: free tiers of common providers usually cover small pools; large sends may hit daily caps and need a ~USD 20/month plan shared across all pools.
- Hosting share: platform fixed cost ~USD 200–300/season split across pools; shown as a note, not charged per text.
- For CAD, multiply USD by roughly 1.35–1.40 (check current rate).

| Pool size | Season email volume (rough) | Season SMS if 2 texts/player/week | Twilio SMS rough USD | Notes |
|---|---|---|---|---|
| 10 | ~350–550 | ~360 segments | ~$4–6 | Free tier email fine. SMS cost small but still > $0.99. Copy/Share covers it easily. |
| 25 | ~900–1,350 | ~900 | ~$10–15 | Around today's SUNDAY26 size. One 500-text pack wouldn't last the season; two would. |
| 50 | ~1,800–2,700 | ~1,800 | ~$20–30 | Email still near free-tier limits. SMS ≈ 4 packs of 500. |
| 100 | ~3,600–5,400 | ~3,600 | ~$40–60 | Top-X lists needed. Email bursts of 100 at once may hit free daily caps. |
| 250 | ~9,000–13,500 | ~9,000 | ~$100–155 | Paid email tier needed. SMS for everyone is costly — offer SMS only to opted-in players. |

**Multipliers to watch:** one emoji or >160 characters can double or triple SMS cost. Adding a third weekly text adds 50%. Phone-number rental (~USD 6/season) and US 10DLC fees are extra and fixed.

## Open questions for Robert

1. Tiebreaker order for "rank" in a survivor pool (for top-X lists)?
2. Free-tier size: 10, 15 or 20 players?
3. Charge in CAD only, or CAD + USD? Do you want to register for GST/HST once revenue approaches the small-supplier threshold?
4. Any legal comfort check on hosting pools where organizers run cash prizes (even off-platform)? Worth one conversation before selling.
5. Should SUNDAY26 keep platform-paid SMS forever, or move to Copy/Share too?
6. Allow US organizers from day one (means 10DLC registration), or Canada only at first?
7. Who handles support for other pools' players — you, or the pool Admin only?
8. Should players in several pools get one combined email, or one per pool?

## Appendix: competitor notes

- **Splash / RunYourPool (self-managed, 2026):** tiered one-time season fee by entries (NHL survivor: $15 flat to 10 entries, then $1.25 / $1.00 / $0.75 / $0.50 per entry by tier; MLB: $20 flat, then $2.00 → $0.75). Commissioners collect money externally. NFL tiers not checked but likely similar.
- **GridironGames:** first entry free; $2.00 per entry for 2–50, stepping down to $0.75 above 500.
- **Sunday Survivor / My Survivor Pool:** per Robert's research — free small pools, season fee by entry count, email reminders and recaps, no SMS product in public pricing. Not re-verified in this pass.
- **Sleeper Survivor:** per Robert's research — in-app alerts and chat, no commissioner SMS packs. Not re-verified in this pass.
- **Yahoo / ESPN free survivor games:** free, ad- and platform-funded; not a model a small app can copy.
- **SMS-pack sellers outside sports:** YouCanBookMe and Koalendar (~USD 0.07 per credit, volume discounts from 200); bookitLive (packs 100–2,000, never expire, auto top-up); Operoo (admin-only pack purchases). Pattern: SMS is always an add-on, never bundled free.
- **Twilio (Canada, long code):** ~USD 0.0079–0.0083 per outbound segment + carrier fees; number ~USD 1.15/month; failed-message fee USD 0.001.
