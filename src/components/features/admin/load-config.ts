import "server-only";
import { listPoolRoleGrants } from "@/lib/roles-db";
import { prisma } from "@/lib/db";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import { loadAdminGate, loadPoolMembers } from "./load-admin";
import { survivalCounts, toTransferMembers } from "./map-config";
import { adminUserIdSet, toDemoteIds, toRoleMembers } from "./map-users";
import type { ConfigScreenProps } from "./types";

export async function loadConfigPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: ConfigScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  const { me } = gate;
  const members = await loadPoolMembers(me.poolId);
  const grants = await listPoolRoleGrants(prisma, me.poolId);
  const adminIds = adminUserIdSet(grants);
  const counts = survivalCounts(members);
  return {
    ok: true,
    props: {
      currentWeek: effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek),
      singleEliminationFromWeek: me.pool.singleEliminationFromWeek,
      ...counts,
      transferMembers: toTransferMembers(members, gate.userId),
      roleMembers: toRoleMembers(members, adminIds, gate.userId),
      canDemoteMembershipIds: toDemoteIds(members, adminIds, grants),
    },
  };
}
