import "server-only";
import { prisma } from "@/lib/db";
import { effectiveCurrentWeek, isDemoEmail } from "@/lib/pool-mode";
import { loadAdminGate } from "./load-admin";
import { toWeekGames } from "./map-config";
import type { SystemScreenProps } from "./types";

export async function loadSystemPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: SystemScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  const { me, session } = gate;
  const weekNumber = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const [week, logs] = await Promise.all([
    prisma.week.findUniqueOrThrow({
      where: { poolId_number: { poolId: me.poolId, number: weekNumber } },
      include: { games: true },
    }),
    prisma.auditLog.findMany({
      where: { poolId: me.poolId },
      orderBy: { createdAt: "desc" },
      take: 40,
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
      logs: logs.map((row) => ({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt.toISOString(),
        details: row.details,
      })),
    },
  };
}
