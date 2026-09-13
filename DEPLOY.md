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
| `AUTH_URL` | Same production URL |

`DATABASE_URL` should already be set by the Neon integration — do not paste secrets into the repo.

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
