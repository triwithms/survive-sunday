import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolvePickBackupMode } from "@/lib/pick-mirror";
import { isPlayerSeat } from "@/lib/roles";
import { getMembershipForUser } from "@/lib/session";
import type { AccountMirrorProps } from "./types";

export async function loadMirrorPage(): Promise<AccountMirrorProps> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me || !isPlayerSeat(me)) redirect("/account");

  return {
    membershipId: me.id,
    initialMode: resolvePickBackupMode(me.pickBackup, me.mirrorFromMembershipId),
  };
}
