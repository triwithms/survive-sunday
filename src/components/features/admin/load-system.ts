import "server-only";
import { prisma } from "@/lib/db";
import { effectiveCurrentWeek, isDemoEmail } from "@/lib/pool-mode";
import { loadAdminGate } from "./load-admin";
import { toWeekGames } from "./map-config";
import { buildPickCensus } from "./pick-census";
import type { SystemScreenProps } from "./types";

export async function loadSystemPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: SystemScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  const { me, session } = gate;
  const weekNumber = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const [week, logs, members] = await Promise.all([
    prisma.week.findUniqueOrThrow({
      where: { poolId_number: { poolId: me.poolId, number: weekNumber } },
      include: {
        games: true,
        picks: { select: { membershipId: true, teamAbbr: true, source: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { poolId: me.poolId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.membership.findMany({
      where: { poolId: me.poolId },
      select: {
        id: true,
        nickname: true,
        status: true,
        role: true,
        isParticipant: true,
        playingFromWeek: true,
      },
    }),
  ]);
  const email = session.user.email ?? me.user.email ?? null;
  return {
    ok: true,
    props: {
      currentEmail: email,
      isPracticeLogin: isDemoEmail(email),
      weekNumber: week.number,
      games: toWeekGames(week.games),
      census: buildPickCensus(week.number, members, week.picks),
      logs: logs.map((row) => ({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt.toISOString(),
        details: row.details,
      })),
    },
  };
}
