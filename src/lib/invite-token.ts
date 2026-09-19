import { expiresAt, hmacHex, hmacMatch, isExpired, randomToken } from "./token-crypto";

export const INVITE_TOKEN = {
  salt: "invite",
  ttlMs: 14 * 24 * 60 * 60 * 1000,
  bytes: 32,
} as const;

export type MintedInvite = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

export function mintInviteSecret(
  ttlMs = INVITE_TOKEN.ttlMs,
  now = Date.now()
): MintedInvite {
  const token = randomToken(INVITE_TOKEN.bytes);
  return {
    token,
    tokenHash: hmacHex(token, INVITE_TOKEN.salt),
    expiresAt: expiresAt(ttlMs, now),
  };
}

export function hashInviteToken(token: string): string {
  return hmacHex(token.trim(), INVITE_TOKEN.salt);
}

export function inviteSecretsMatch(token: string, tokenHash: string): boolean {
  return hmacMatch(token.trim(), INVITE_TOKEN.salt, tokenHash);
}

export function inviteIsUsable(
  row: { expiresAt: Date; consumedAt: Date | null },
  now = Date.now()
): boolean {
  if (row.consumedAt) return false;
  return !isExpired(row.expiresAt, now);
}

export function inviteJoinPath(token: string): string {
  return `/join?t=${encodeURIComponent(token)}`;
}

export function inviteLoginPath(token: string): string {
  return `/login?invite=${encodeURIComponent(token)}`;
}
