import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import { ROLE_VIEW_COOKIE, resolveRoleView, type RoleView } from "@/lib/roles";

export type AppMembership = {
  userId: string;
  membershipId: string;
  poolId: string;
  nickname: string;
  status: string;
  role: string;
  playingFromWeek: number | null;
  poolMode: string;
  poolCurrentWeek: number;
  singleEliminationFromWeek: number | null;
  isPlayer: boolean;
  isAdmin: boolean;
  roleView: RoleView;
  phoneE164: string | null;
  phoneSkippedAt: Date | null;
};

export async function loadAppMembership(): Promise<AppMembership> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ctx = await getUserPoolContext(session.user.id);
  const membership = ctx.membership;
  if (!membership) redirect("/join");

  const cookieStore = await cookies();
  const roleView = resolveRoleView({
    isPlayer: ctx.isPlayer,
    isAdmin: ctx.isAdmin,
    requested: cookieStore.get(ROLE_VIEW_COOKIE)?.value,
  });

  return {
    userId: session.user.id,
    membershipId: membership.id,
    poolId: membership.poolId,
    nickname: membership.nickname,
    status: membership.status,
    role: membership.role,
    playingFromWeek: membership.playingFromWeek,
    poolMode: membership.pool.mode,
    poolCurrentWeek: membership.pool.currentWeek,
    singleEliminationFromWeek: membership.pool.singleEliminationFromWeek,
    isPlayer: ctx.isPlayer,
    isAdmin: ctx.isAdmin,
    roleView,
    phoneE164: membership.user.phoneE164,
    phoneSkippedAt: membership.user.phoneSkippedAt,
  };
}
