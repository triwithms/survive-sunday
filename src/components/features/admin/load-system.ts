import "server-only";
import { prisma } from "@/lib/db";
import { readEmailDeliveryStatus } from "@/lib/delivery";
import { loadAdminGate } from "./load-admin";
import type { SystemScreenProps } from "./types";

export async function loadSystemPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: SystemScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  const logs = await prisma.auditLog.findMany({
    where: { poolId: gate.me.poolId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return {
    ok: true,
    props: {
      delivery: readEmailDeliveryStatus(),
      logs: logs.map((row) => ({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt.toISOString(),
        details: row.details,
      })),
    },
  };
}
