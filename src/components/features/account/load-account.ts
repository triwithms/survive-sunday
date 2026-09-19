import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { profileIsComplete, snapshotFromMember } from "@/lib/profile-complete";
import { isPlayerSeat, ROLE_VIEW_COOKIE, resolveRoleView } from "@/lib/roles";
import { getUserPoolContext } from "@/lib/session";
import type { AccountScreenProps } from "./types";

export async function loadAccountPage(): Promise<AccountScreenProps> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const ctx = await getUserPoolContext(session.user.id);
  const me = ctx.membership;
  if (!me) redirect("/join");
  if (!profileIsComplete(snapshotFromMember(me))) redirect("/welcome");
  const cookieStore = await cookies();
  const roleView = resolveRoleView({
    isPlayer: ctx.isPlayer,
    isAdmin: ctx.isAdmin,
    requested: cookieStore.get(ROLE_VIEW_COOKIE)?.value,
  });
  return {
    nickname: me.nickname,
    statusLabel: me.status.replace("_", " "),
    canSwitchRoles: ctx.isPlayer && ctx.isAdmin,
    roleView,
    showAdmin: ctx.isAdmin && roleView === "admin",
    showPickBackup: ctx.isPlayer && isPlayerSeat(me),
    phoneE164: me.user.phoneE164,
  };
}
