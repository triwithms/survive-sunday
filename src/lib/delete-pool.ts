import "server-only";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import {
  EXTERNAL_PICKS_DELETE_BLOCK,
  poolNameConfirmMatches,
  preferredPoolAfterDelete,
  slateOwnerDeleteBlock,
  type PoolAfterDelete,
} from "./delete-pool-plan";

export class DeletePoolBlocked extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeletePoolBlocked";
  }
}

export type DeletePoolResult =
  | { ok: true; nextPoolId: string | null }
  | { ok: false; status: number; error: string };

function isFkRestrict(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
  );
}

/**
 * Remove the active pool and rows that belong to it.
 * Prisma onDelete Cascade covers memberships, picks, weeks, games on those
 * weeks, invites, access roles, week-wrap settings, and this pool's audit log.
 * Picks here are unhooked from games first so a shared game row is left alone.
 * A pool other pools use as slatePoolId is refused (onDelete Restrict).
 * User logins are not deleted.
 */
export async function deleteActivePool(args: {
  poolId: string;
  actorUserId: string;
  confirmName: string;
}): Promise<DeletePoolResult> {
  const pool = await prisma.pool.findUnique({
    where: { id: args.poolId },
    select: { id: true, name: true },
  });
  if (!pool) return { ok: false, status: 404, error: "Pool not found" };
  if (!poolNameConfirmMatches(args.confirmName, pool.name)) {
    return {
      ok: false,
      status: 400,
      error: "Type the pool name exactly to delete it.",
    };
  }

  try {
    const nextPoolId = await prisma.$transaction(
      async (tx) => {
        const dependents = await tx.pool.findMany({
          where: { slatePoolId: pool.id },
          select: { name: true },
          orderBy: { name: "asc" },
        });
        if (dependents.length > 0) {
          throw new DeletePoolBlocked(
            slateOwnerDeleteBlock(dependents.map((row) => row.name))
          );
        }

        const externalPicks = await tx.pick.count({
          where: {
            game: { week: { poolId: pool.id } },
            membership: { poolId: { not: pool.id } },
          },
        });
        if (externalPicks > 0) {
          throw new DeletePoolBlocked(EXTERNAL_PICKS_DELETE_BLOCK);
        }

        await tx.pick.updateMany({
          where: { membership: { poolId: pool.id } },
          data: { gameId: null },
        });
        await tx.pool.delete({ where: { id: pool.id } });

        const seats = await tx.membership.findMany({
          where: { userId: args.actorUserId },
          select: {
            pool: {
              select: {
                id: true,
                createdAt: true,
                inviteCode: true,
                mode: true,
                slatePoolId: true,
              },
            },
          },
        });
        const remaining: PoolAfterDelete[] = seats.map((seat) => seat.pool);
        return preferredPoolAfterDelete(remaining, INVITE_CODE);
      },
      { timeout: 30_000 }
    );
    return { ok: true, nextPoolId };
  } catch (error) {
    if (error instanceof DeletePoolBlocked) {
      return { ok: false, status: 409, error: error.message };
    }
    if (isFkRestrict(error)) {
      return {
        ok: false,
        status: 409,
        error: slateOwnerDeleteBlock([]),
      };
    }
    throw error;
  }
}
