import "server-only";
import { prisma } from "@/lib/db";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import { listAdminMissingPicks } from "@/lib/missing-pick-list";
import { loadWeekWrapPanel } from "@/lib/week-wrap-load";
import { loadAdminGate } from "./load-admin";
import { loadEnterPick } from "./load-enter-pick";
import type { SystemScreenProps } from "./types";

export async function loadSystemPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: SystemScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  const weekNumber = effectiveCurrentWeek(gate.me.pool.mode, gate.me.pool.currentWeek);
  const [logs, enterPick, weekWrap, missingPicks] = await Promise.all([
    prisma.auditLog.findMany({
      where: { poolId: gate.me.poolId },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    loadEnterPick(gate.me.poolId, weekNumber),
    loadWeekWrapPanel(gate.me.poolId),
    listAdminMissingPicks(gate.me.poolId),
  ]);
  return {
    ok: true,
    props: {
      weekNumber,
      enterPick,
      missingPicks,
      weekWrap,
      logs: logs.map((row) => ({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt.toISOString(),
        details: row.details,
      })),
    },
  };
}
