import { POOL_ROLES, isPlayerSeat, type PoolRoleName } from "./roles";

type RoleClient = {
  poolAccessRole: {
    createMany: (args: {
      data: Array<{ poolId: string; userId: string; role: string }>;
      skipDuplicates?: boolean;
    }) => Promise<unknown>;
    deleteMany: (args: {
      where: { poolId: string; userId: string; role: string };
    }) => Promise<unknown>;
    findMany: (args: {
      where: { poolId?: string; userId?: string };
      select?: { userId?: true; role?: true; poolId?: true };
    }) => Promise<Array<{ userId: string; role: string; poolId?: string }>>;
  };
  membership: {
    findMany: (args: {
      where?: { poolId?: string };
      select: { poolId: true; userId: true; role: true; isAdmin: true };
    }) => Promise<
      Array<{
        poolId: string;
        userId: string;
        role: string;
        isAdmin: boolean;
      }>
    >;
    updateMany: (args: {
      where: { poolId: string; userId: string };
      data: { isAdmin: boolean };
    }) => Promise<unknown>;
  };
};

export async function grantPoolRole(
  db: RoleClient,
  args: { poolId: string; userId: string; role: PoolRoleName }
) {
  await db.poolAccessRole.createMany({
    data: [{ poolId: args.poolId, userId: args.userId, role: args.role }],
    skipDuplicates: true,
  });
  if (args.role === POOL_ROLES.administrator) {
    await db.membership.updateMany({
      where: { poolId: args.poolId, userId: args.userId },
      data: { isAdmin: true },
    });
  }
}

export async function revokePoolRole(
  db: RoleClient,
  args: { poolId: string; userId: string; role: PoolRoleName }
) {
  await db.poolAccessRole.deleteMany({
    where: {
      poolId: args.poolId,
      userId: args.userId,
      role: args.role,
    },
  });
  if (args.role === POOL_ROLES.administrator) {
    await db.membership.updateMany({
      where: { poolId: args.poolId, userId: args.userId },
      data: { isAdmin: false },
    });
  }
}

export async function listUserPoolRoles(
  db: RoleClient,
  args: { poolId: string; userId: string }
): Promise<string[]> {
  const rows = await db.poolAccessRole.findMany({
    where: { poolId: args.poolId, userId: args.userId },
    select: { role: true, userId: true },
  });
  return rows.map((row) => row.role);
}

export async function listPoolRoleGrants(
  db: RoleClient,
  poolId: string
): Promise<Array<{ userId: string; role: string }>> {
  return db.poolAccessRole.findMany({
    where: { poolId },
    select: { userId: true, role: true },
  });
}

/** Infer grants from seats when the table is empty (first deploy / local). */
export function inferredGrantsFromMemberships(
  members: Array<{
    poolId: string;
    userId: string;
    role: string;
    isAdmin: boolean;
  }>
): Array<{ poolId: string; userId: string; role: string }> {
  const seen = new Set<string>();
  const rows: Array<{ poolId: string; userId: string; role: string }> = [];
  const add = (poolId: string, userId: string, role: string) => {
    const key = `${poolId}:${userId}:${role}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ poolId, userId, role });
  };
  for (const member of members) {
    if (isPlayerSeat(member)) {
      add(member.poolId, member.userId, POOL_ROLES.player);
    }
    if (member.role === "admin" || member.isAdmin) {
      add(member.poolId, member.userId, POOL_ROLES.administrator);
    }
  }
  return rows;
}

export async function backfillPoolAccessRoles(
  db: RoleClient,
  poolId?: string
): Promise<number> {
  const members = await db.membership.findMany({
    where: poolId ? { poolId } : undefined,
    select: { poolId: true, userId: true, role: true, isAdmin: true },
  });
  const data = inferredGrantsFromMemberships(members);
  if (data.length === 0) return 0;
  await db.poolAccessRole.createMany({ data, skipDuplicates: true });
  return data.length;
}
