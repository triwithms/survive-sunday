import "server-only";
import { prisma } from "@/lib/db";
import {
  effectiveCurrentWeek,
  isDemoEmail,
  normalizePoolMode,
} from "@/lib/pool-mode";
import { loadAdminGate, loadPoolMembers } from "./load-admin";
import { survivalCounts, toTransferMembers, toWeekGames } from "./map-config";
import type { ConfigScreenProps } from "./types";

export async function loadConfigPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: ConfigScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  const { me, session } = gate;
  const members = await loadPoolMembers(me.poolId);
  const weekNumber = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const week = await prisma.week.findUniqueOrThrow({
    where: { poolId_number: { poolId: me.poolId, number: weekNumber } },
    include: { games: true },
  });
  const counts = survivalCounts(members);
  const email = session.user.email ?? me.user.email ?? null;
  return {
    ok: true,
    props: {
      initialMode: normalizePoolMode(me.pool.mode),
      isPracticeLogin: isDemoEmail(email),
      currentEmail: email,
      currentWeek: weekNumber,
      singleEliminationFromWeek: me.pool.singleEliminationFromWeek,
      ...counts,
      transferMembers: toTransferMembers(members, gate.userId),
      weekNumber: week.number,
      games: toWeekGames(week.games),
    },
  };
}
