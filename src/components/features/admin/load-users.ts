import "server-only";
import { listPoolRoleGrants } from "@/lib/roles-db";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import { prisma } from "@/lib/db";
import { loadAdminGate, loadPoolMembers } from "./load-admin";
import { loadEnterPick } from "./load-enter-pick";
import {
  adminUserIdSet,
  toDemoteIds,
  toPasswordMembers,
  toRoleMembers,
} from "./map-users";
import { toRemoveMembers, toRosterMembers } from "./map-roster";
import type { UsersScreenProps } from "./types";

export async function loadUsersPage(): Promise<
  { ok: false; isDemo: boolean } | { ok: true; props: UsersScreenProps }
> {
  const gate = await loadAdminGate();
  if (!gate.ok) return { ok: false, isDemo: gate.isDemo };
  const weekNumber = effectiveCurrentWeek(
    gate.me.pool.mode,
    gate.me.pool.currentWeek
  );
  const [members, grants, enterPick] = await Promise.all([
    loadPoolMembers(gate.me.poolId),
    listPoolRoleGrants(prisma, gate.me.poolId),
    loadEnterPick(gate.me.poolId, weekNumber),
  ]);
  const adminIds = adminUserIdSet(grants);
  const userId = gate.userId;
  return {
    ok: true,
    props: {
      passwordMembers: toPasswordMembers(members),
      roleMembers: toRoleMembers(members, adminIds, userId),
      canDemoteMembershipIds: toDemoteIds(members, adminIds, grants),
      rosterMembers: toRosterMembers(members),
      removeMembers: toRemoveMembers(members),
      enterPick,
    },
  };
}
