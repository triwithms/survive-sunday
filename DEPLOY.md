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

If they already Joined and would rather not type the password: Sign in → **Email me a sign-in code** (same keys). Optional **Text me a code** only if a cell is saved. This is not a code at every login.

Demo seats (`@survivesunday.demo`) always use **demo1234**. No reset.

**Minimum for friends today** (Vercel → nfl-pool → survive-sunday → Settings → Environment Variables → Production):

| Variable | What to paste |
|---|---|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free). |
| `RESEND_FROM_EMAIL` | A From address Resend has **verified**, e.g. `Survive Sunday <noreply@yourdomain.com>`. |

Click-by-click:

1. Sign up at [resend.com](https://resend.com) (free).
2. **Domains → Add domain** for a domain you own. Add the DNS records Resend shows. Wait until it says **Verified**.
3. **API Keys → Create**. Copy the key once.
4. In Vercel, add the two names above. Environment: **Production** (add Preview too if you want to test the preview URL first).
5. Merge this pull request. If you added the keys after a deploy already ran, open Vercel → Deployments → the latest Production row → ⋮ → **Redeploy**.

Without those two keys, Forgot password and sign-in codes say we couldn’t send a code. The same two keys send pool emails (pick saved, results, missing-pick reminder, commissioner notes) to friends who left those types on under **Account → Notification preferences**.

Optional texts (only if a friend saved a cell). Skip for today if email is enough:

| Variable | What to paste |
|---|---|
| `TWILIO_ACCOUNT_SID` | From [twilio.com](https://www.twilio.com) (trial is fine) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Your Twilio number, e.g. `+14165551234` |

Local `next dev` without keys: the code is printed in the terminal and shown on the page.

## 4. Build / first schema + seed

On first deploy (or via Vercel CLI / a one-off shell with prod `DATABASE_URL`):

```bash
npm install
npx prisma generate
npx prisma db push
npm run seed
```

- Prefer **`prisma db push`** for the first deploy — there is no `prisma/migrations` folder yet.
- `postinstall` already runs `prisma generate`.
- `npm run build` also runs `prisma db push` (when `DATABASE_URL` is set) and seeds the BM Boys demo pool if `SUNDAY26` is missing. That keeps Vercel from serving Auth.js `CallbackRouteError` on `/api/demo-enter` against an empty or un-migrated Neon database.
- Re-run `npm run seed` only when you intentionally want demo/seed data refreshed.

## 5. Verify

- Hit the production URL, sign in / seed accounts as documented in README
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
