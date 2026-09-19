import { NICKNAME_TAKEN, uniqueContactFail } from "./contact-taken";
import { rosterContactClash } from "./contact-taken-db";
import { prisma } from "./db";
import { nicknameTaken, type RosterProfileValue } from "./roster-profile";
import { ensureUserEmailNullable } from "./user-email-schema";

type AdminCtx = { user: { id: string }; membership: { poolId: string } };
export type SavedRoster = {
  id: string;
  nickname: string;
  realName: string | null;
  email: string | null;
  phoneE164: string | null;
};
export type SaveRosterResult =
  | { ok: true; membership: SavedRoster }
  | { ok: false; error: string; status: number };

export async function saveRosterProfile(
  admin: AdminCtx,
  value: RosterProfileValue
): Promise<SaveRosterResult> {
  const target = await prisma.membership.findFirst({
    where: { id: value.membershipId, poolId: admin.membership.poolId },
    include: { user: { select: { id: true, email: true, phoneE164: true, name: true } } },
  });
  if (!target) return { ok: false, error: "Not found", status: 404 };

  if (value.nickname.toLowerCase() !== target.nickname.toLowerCase()) {
    const pool = await prisma.membership.findMany({
      where: { poolId: admin.membership.poolId },
      select: { id: true, nickname: true },
    });
    if (nicknameTaken(pool, target.id, value.nickname)) {
      return { ok: false, error: NICKNAME_TAKEN, status: 409 };
    }
  }

  const clash = await rosterContactClash(
    { id: target.userId, email: target.user.email, phoneE164: target.user.phoneE164 },
    { email: value.email, phoneE164: value.phoneE164 }
  );
  if (clash) return { ok: false, ...clash };
  if (!value.email) await ensureUserEmailNullable(prisma);

  try {
    const [membership, user] = await prisma.$transaction([
      prisma.membership.update({
        where: { id: target.id },
        data: { nickname: value.nickname, realName: value.realName },
        select: { id: true, nickname: true, realName: true },
      }),
      prisma.user.update({
        where: { id: target.userId },
        data: {
          email: value.email,
          phoneE164: value.phoneE164,
          phoneSkippedAt: value.phoneE164 ? null : undefined,
          name: value.realName ?? target.user.name,
        },
        select: { email: true, phoneE164: true },
      }),
    ]);
    const from = {
      nickname: target.nickname, realName: target.realName,
      email: target.user.email, phoneE164: target.user.phoneE164,
    };
    const to = {
      nickname: membership.nickname, realName: membership.realName,
      email: user.email, phoneE164: user.phoneE164,
    };
    await prisma.auditLog.create({
      data: {
        poolId: admin.membership.poolId, actorId: admin.user.id,
        action: "update_roster", targetType: "membership", targetId: target.id,
        details: JSON.stringify({ from, to }),
      },
    });
    return { ok: true, membership: { ...membership, email: user.email, phoneE164: user.phoneE164 } };
  } catch (err) {
    const fail = uniqueContactFail(err);
    if (fail) return { ok: false, ...fail };
    throw err;
  }
}
