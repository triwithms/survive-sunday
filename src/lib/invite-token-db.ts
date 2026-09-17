import "server-only";
import { prisma } from "./db";
import {
  hashInviteToken,
  inviteIsUsable,
  mintInviteSecret,
  type MintedInvite,
} from "./invite-token";
import {
  ensureInviteTokenTable,
  isMissingInviteTokenSchema,
} from "./invite-token-schema";

async function withInviteTable<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isMissingInviteTokenSchema(error)) throw error;
    await ensureInviteTokenTable(prisma);
    return fn();
  }
}

export async function createHashedInviteToken(
  membershipId: string
): Promise<MintedInvite> {
  const minted = mintInviteSecret();
  await withInviteTable(async () => {
    await prisma.inviteToken.updateMany({
      where: { membershipId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await prisma.inviteToken.create({
      data: {
        tokenHash: minted.tokenHash,
        membershipId,
        expiresAt: minted.expiresAt,
      },
    });
  });
  return minted;
}

export async function peekInviteToken(token: string) {
  const raw = token.trim();
  if (!raw) return null;
  const tokenHash = hashInviteToken(raw);
  const row = await withInviteTable(() =>
    prisma.inviteToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        membershipId: true,
        expiresAt: true,
        consumedAt: true,
      },
    })
  );
  if (!row || !inviteIsUsable(row)) return null;
  return row;
}

export async function consumeInviteToken(token: string): Promise<boolean> {
  const raw = token.trim();
  if (!raw) return false;
  const tokenHash = hashInviteToken(raw);
  const result = await withInviteTable(() =>
    prisma.inviteToken.updateMany({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    })
  );
  return result.count > 0;
}
