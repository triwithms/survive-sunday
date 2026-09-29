import "server-only";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { nicknameInviteSlug, resolveSeatFromInvite } from "./invite-link";

/**
 * Roster claim by nickname. Seat id is resolved by the caller from the
 * membership row (that row's pool wins). A pool id only chooses which
 * roster to search. Missing pool keeps the live SUNDAY26 links working.
 */
export async function resolveWhoJoinSeat(opts: {
  who: string | null | undefined;
  poolId?: string | null;
}): Promise<string | null> {
  const who = nicknameInviteSlug(opts.who ?? "");
  if (!who) return null;
  const requested = (opts.poolId ?? "").trim();
  const pool = requested
    ? await prisma.pool.findUnique({
        where: { id: requested },
        select: { id: true },
      })
    : await prisma.pool.findUnique({
        where: { inviteCode: INVITE_CODE },
        select: { id: true },
      });
  if (!pool) return null;
  const members = await prisma.membership.findMany({
    where: { poolId: pool.id, role: { not: "admin" } },
    select: { id: true, nickname: true },
  });
  const match = resolveSeatFromInvite(
    members.map((member) => ({
      membershipId: member.id,
      nickname: member.nickname,
      realName: null,
      claimed: false,
      label: member.nickname,
    })),
    { who }
  );
  return match?.membershipId ?? null;
}
