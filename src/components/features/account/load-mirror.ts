import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatSeatLabel } from "@/lib/claim-seat";
import { resolvePickBackupMode } from "@/lib/pick-mirror";
import { isPlayerSeat } from "@/lib/roles";
import { getMembershipForUser } from "@/lib/session";
import type { AccountMirrorProps } from "./types";

export async function loadMirrorPage(): Promise<AccountMirrorProps> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me || !isPlayerSeat(me)) redirect("/account");

  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId, role: { not: "admin" }, id: { not: me.id } },
    select: { id: true, nickname: true, realName: true },
    orderBy: { nickname: "asc" },
  });

  return {
    membershipId: me.id,
    initialMode: resolvePickBackupMode(me.pickBackup, me.mirrorFromMembershipId),
    initialSourceId: me.mirrorFromMembershipId,
    options: members.map((row) => ({
      id: row.id,
      nickname: row.nickname,
      label: formatSeatLabel(row.nickname, row.realName),
    })),
  };
}
