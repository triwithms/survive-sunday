import { normalizeAuthEmail, passwordsMatch } from "./auth-credentials";
import { INVITE_CODE } from "./constants";
import { prisma } from "./db";
import { isDemoEmail, isLiveMode } from "./pool-mode";

export type CredentialRecord = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  passwordHash: string | null;
};

export type AuthorizedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export async function lookupUserByEmail(email: string): Promise<CredentialRecord | null> {
  const normalized = normalizeAuthEmail(email);
  const byNormalized = await prisma.user.findUnique({ where: { email: normalized } });
  if (byNormalized) return byNormalized;
  const raw = email.trim();
  if (raw && raw !== normalized) {
    return prisma.user.findUnique({ where: { email: raw } });
  }
  return null;
}

/** Email, or pool nickname when the friend types a username. */
export async function lookupUserByLogin(login: string): Promise<CredentialRecord | null> {
  const trimmed = login.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return lookupUserByEmail(trimmed);
  const member = await prisma.membership.findFirst({
    where: { nickname: { equals: trimmed, mode: "insensitive" } },
    select: { user: true },
  });
  return member?.user ?? null;
}

/**
 * Resolve a credentials login. Must not throw — Auth.js wraps authorize
 * exceptions as CallbackRouteError (HTTP path shows Configuration).
 *
 * Live pool:
 * - Practice member emails cannot sign in.
 * - Practice administrator may sign in only until a real administrator email exists
 *   (so the owner is not locked out before saving a real login).
 */
export async function userFromCredentials(
  email: string,
  password: string,
  lookup: (email: string) => Promise<CredentialRecord | null> = lookupUserByLogin
): Promise<AuthorizedUser | null> {
  try {
    const user = await lookup(email);
    if (!user?.passwordHash) return null;

    if (isDemoEmail(email)) {
      const pool = await prisma.pool.findUnique({
        where: { inviteCode: INVITE_CODE },
        select: { id: true, mode: true },
      });
      if (isLiveMode(pool?.mode) && pool) {
        const admins = await prisma.membership.findMany({
          where: { poolId: pool.id, role: "admin" },
          select: { userId: true, user: { select: { email: true } } },
        });
        // INTERNAL name kept; user-facing copy says administrator.
        const hasRealCommissioner = admins.some((a) => !isDemoEmail(a.user.email));
        const isPracticeAdmin = admins.some((a) => a.userId === user.id);
        if (hasRealCommissioner || !isPracticeAdmin) return null;
      }
    }

    if (!(await passwordsMatch(password, user.passwordHash))) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    };
  } catch (error) {
    console.error("[auth] credentials authorize failed", error);
    return null;
  }
}
