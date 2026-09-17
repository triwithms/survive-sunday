import { bearerToken, verifyApiToken } from "./api-token";
import { timingSafeString } from "./token-crypto";

/** Vercel Cron sends x-vercel-cron: 1. CRON_SECRET or signed AUTH_SECRET token. */
export function cronAuthorized(req: Request): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true;
  const token = bearerToken(req);
  if (!token) return false;
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && timingSafeString(token, secret)) return true;
  try {
    return Boolean(verifyApiToken(token, "cron"));
  } catch {
    return false;
  }
}
