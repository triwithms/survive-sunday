import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { profileIsComplete, snapshotFromMember } from "@/lib/profile-complete";
import { isPlayerSeat, ROLE_VIEW_COOKIE, resolveRoleView } from "@/lib/roles";
import { entryFeeForViewer } from "@/lib/payment-tracking";
import {
  earliestPlayableWeek,
  futureStartWeekChoices,
} from "@/lib/pool-start-week";
import { findSharedSlate, slateKickoffWeeks } from "@/lib/pool-start-slate";
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
  const slate = await findSharedSlate();
  const earliest = slate
    ? earliestPlayableWeek({
        currentWeek: slate.currentWeek,
        weeks: slateKickoffWeeks(slate.weeks),
      })
    : null;
  return {
    nickname: me.nickname,
    statusLabel: me.status.replace("_", " "),
    canSwitchRoles: ctx.isPlayer && ctx.isAdmin,
    roleView,
    showAdmin: ctx.isAdmin && roleView === "admin",
    showPickBackup: ctx.isPlayer && isPlayerSeat(me),
    phoneE164: me.user.phoneE164,
    pools: ctx.pools,
    activePoolId: ctx.activePoolId,
    poolStartWeek: me.pool.startWeek,
    startWeeks: futureStartWeekChoices(earliest),
    defaultStartWeek: earliest,
    entryFee: entryFeeForViewer(session.user.id, {
      userId: me.userId,
      enabled: me.pool.paymentTrackingEnabled,
      status: me.paymentStatus,
      instructions: me.pool.paymentInstructions,
      link: me.pool.paymentLink,
    }),
  };
}
