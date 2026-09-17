# Deploy — Vercel Hobby + Neon Postgres

Short checklist for the free Hobby path. No paid add-ons required.

## 1. Import the repo

- In Vercel: **Add New → Project**
- Import / link GitHub `triwithms/survive-sunday`
- Framework preset: Next.js (auto-detected)

## 2. Neon Marketplace (DATABASE_URL)

- Add the **Neon** Marketplace integration (free tier)
- This creates a Neon project and sets `DATABASE_URL` on the Vercel project automatically
- Prefer the **pooled** connection string Neon provides (Prisma works with it; no extra adapter needed)

## 3. Auth / app env vars

Set these in Vercel → Project → Settings → Environment Variables (Production):

| Variable | Value |
|---|---|
| `AUTH_SECRET` | Long random string (e.g. `openssl rand -base64 32`). **Required** — without it Auth.js 500s every `/api/auth/*` route and demo login cannot create a session. |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://survive-sunday.vercel.app`) |
| `AUTH_URL` | Same production URL, or **omit**. `https://example.com` (and other IANA example.* placeholders) is ignored so request Host wins. |

`DATABASE_URL` should already be set by the Neon integration — do not paste secrets into the repo.

## 3b. Forgot password today — two keys (email)

Friends stay signed in. We do **not** ask for a code at every sign-in.

If they forget the password: Sign in → **Forgot password?** → 6-digit code by email → new password → back in the pool.

If they already Joined: Sign in starts with **Email me a sign-in code** (same keys). **Use password instead** if they know it. Optional **Text me a code** only if a cell is saved. This is not a code at every login.

Demo seats (`@survivesunday.demo`) always use **demo1234**. No reset.

**Minimum for friends today** (Vercel → nfl-pool → survive-sunday → Settings → Environment Variables → Production):

| Variable | What to paste |
|---|---|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free). Starts with `re_`. |
| `RESEND_FROM_EMAIL` | A From address Resend has **verified**, e.g. `Survive Sunday <noreply@yourdomain.com>`. **Not** `onboarding@resend.dev`. |

Click-by-click (you do this; a chat cannot):

1. Sign up at [resend.com](https://resend.com) (free) if you do not already have an account.
2. **Domains → Add domain** for a domain you own. Add the DNS records Resend shows. Wait until it says **Verified**.
3. **API Keys → Create**. Copy the key once (it starts with `re_`).
4. Open [vercel.com](https://vercel.com) → team **nfl-pool** → project **survive-sunday** → **Settings → Environment Variables**.
5. Find `RESEND_API_KEY`. If it is missing, **Add**. Paste the `re_…` key. Tick **Production** (Preview-only does **not** help the live site). Save.
6. Find `RESEND_FROM_EMAIL`. If it is missing or still `onboarding@resend.dev`, set it to `Survive Sunday <noreply@your-verified-domain>`. Tick **Production**. Save.
7. Open the row again and confirm Production is ticked for **both** names. A key that only exists on Preview / Development will not send codes to friends on survive-sunday.vercel.app.
8. If you added or changed a key: **Deployments** → ⋮ on the latest **Production** row → **Redeploy**. Do **not** tick “use existing build cache.”
9. On the live site, **Sign in → Use password instead → Forgot password?** with **your** real email. You should get a 6-digit code. If sending fails, the page now says the real reason (missing key, test From address, unverified domain) instead of pretending it worked.

`onboarding@resend.dev` only delivers to *your* Resend login email, not friends — do not use it for the group. That is the usual reason “it worked once for me, but Mike never gets a code.”

Without those two Production keys, Forgot password and sign-in codes say we couldn’t send a code. The same two keys send pool emails (pick saved, results, missing-pick reminder, commissioner notes) to friends who left those types on under **Account → Notification preferences**.

**Stuck friend (e.g. Cannoli Stuffer / Mike Frigo):** after this change is live, Admin → **Set a temporary password** → pick that nickname → type the nickname to confirm → save a password → **text it** to them. They Sign in → **Use password instead**. Do not ask a chat to invent a password. Raw SQL cannot hash a password correctly — use Admin, or `scripts/set-member-password.ts` with Neon `DATABASE_URL` if a coder is helping.

Optional texts (only if a friend saved a cell). Skip for today if email is enough:

| Variable | What to paste |
|---|---|
| `TWILIO_ACCOUNT_SID` | From [twilio.com](https://www.twilio.com) (trial is fine) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Your Twilio number, e.g. `+14165551234` |

Local `next dev` without keys: the code is printed in the terminal and shown on the page.

## 4. Build vs one-off schema / seed

**Vercel / Production build is `next build` only.** `npm run build` compiles the website. It does **not** run `prisma db push`, `npm run seed`, or `scripts/_dangerous/ensure-production-db.ts`. Friends’ picks, names, and emails on Neon stay as they are.

`postinstall` runs `prisma generate` only (Prisma client code — not schema, not seed).

**Do not reattach** `ensure-production-db` (or db push / seed) to the `build` script. A Production deploy must never rewrite live pool data.

Schema push and seed are **optional, intentional, one-off** operations. They are **not** part of a Vercel deploy. Use them locally, or in a one-off CLI / shell — never as “Redeploy so the database can catch up.”

```bash
npm run db:push          # prisma db push (schema only) — refuses Production
npm run seed             # BM Boys demo seed — refuses Production
npm run setup            # generate + db push + seed — refuses Production
```

- Prefer **`prisma db push`** (`npm run db:push`) if you need a schema sync — there is no `prisma/migrations` folder yet.
- `npm run db:push`, `npm run seed`, and `npm run setup` refuse the live production database (`assert-not-production`). Do not point them at Neon Production. Emergency only: `ALLOW_PROD_DB_MUTATION=1`.
- If a trusted person must run a **one-off** production schema helper, that is `ALLOW_PROD_DB_MUTATION=1 tsx scripts/_dangerous/ensure-production-db.ts` with prod `DATABASE_URL` — **never** from the Vercel build, **never** without that break-glass env, and **never** as a habit on every deploy.
- The live BM Boys pool (`SUNDAY26`) already exists. Do **not** re-seed Production.

## 5. Verify

- Hit the production URL, sign in / Join as documented in README
- Confirm picks and standings load against Neon

## Notes

- Local SQLite (`file:./dev.db`) is **not** used for the deploy path. Locally, point `DATABASE_URL` at Neon free or a local Postgres instance (see `.env.example`).
- Standard Prisma `provider = "postgresql"` + Neon pooled `DATABASE_URL` is enough — no `@prisma/adapter-neon` required for this Hobby setup.

## Live scores & injuries (no paid keys)

Hobby path uses **ESPN public JSON** (undocumented site API). Nothing to set in Vercel for this:

| Feed | Source | Auth | Notes |
|---|---|---|---|
| Live / final scores | `site.web.api.espn.com/.../nfl/scoreboard` (fallback `site.api.espn.com`) | none | Sync + ~45s poll in a live window. Finals auto-grade. |
| Injury report | `.../nfl/injuries` | none | Cached ~12 min. Labeled ESPN report, not official NFL. |

Optional later (not wired): `API_SPORTS_KEY` for API-Sports (free ~100 req/day) if ESPN blocks Vercel. Do **not** commit keys. SportsDataIO trial data is scrambled — do not show as real.

ToS: private friends pool only; we do not redistribute a commercial score feed. ESPN/NFL marks stay theirs. Endpoints can break without notice.
