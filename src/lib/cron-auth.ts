/** Vercel Cron sends x-vercel-cron: 1. Optional CRON_SECRET for manual calls. */
export function cronAuthorized(req: Request): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
