import "server-only";
import { listPoolRoleGrants } from "@/lib/roles-db";
import { prisma } from "@/lib/db";
import { loadAdminGate, loadPoolMembers } from "./load-admin";
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
  const members = await loadPoolMembers(gate.me.poolId);
  const grants = await listPoolRoleGrants(prisma, gate.me.poolId);
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
    },
  };
}
