import bcrypt from "bcryptjs";
import { prisma } from "./db";

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
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Resolve a credentials login. Must not throw — Auth.js wraps authorize
 * exceptions as CallbackRouteError (HTTP path shows Configuration).
 */
export async function userFromCredentials(
  email: string,
  password: string,
  lookup: (email: string) => Promise<CredentialRecord | null> = lookupUserByEmail
): Promise<AuthorizedUser | null> {
  try {
    const user = await lookup(email);
    if (!user?.passwordHash) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
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
