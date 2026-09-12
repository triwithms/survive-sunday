import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  ensureWeekLockedEffects,
  undoPickMembershipEffect,
} from "@/lib/grading";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { weekNumber, action, lockAt } = await req.json();
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: admin.membership.poolId,
        number: weekNumber ?? 1,
      },
    },
  });
  if (!week) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  let data: {
    lockAt?: Date;
    lockOverrideAt?: Date | null;
    status?: string;
    missedPicksAppliedAt?: Date | null;
  } = {};
  let clearedMissed = 0;

  if (action === "unlock") {
    // Push lock into the future for testing (override only)
    const future = new Date();
    future.setDate(future.getDate() + 7);
    data = { lockOverrideAt: future, status: "open" };
  } else if (action === "reopen") {
    /**
     * Demo: reopen a locked week for picks.
     * - Sets lockAt to now+7d and clears lockOverrideAt so natural lock applies again.
     * - Clears missedPicksAppliedAt so a future lock can re-apply missed picks.
     * - Removes source=missed MISS picks and undoes their loss effects (demo only).
     *   Real user/imported picks are left intact.
     */
    const future = new Date();
    future.setDate(future.getDate() + 7);
    data = {
      lockAt: future,
      lockOverrideAt: null,
      status: "open",
      missedPicksAppliedAt: null,
    };

    const missedPicks = await prisma.pick.findMany({
      where: { weekId: week.id, source: "missed" },
    });
    for (const pick of missedPicks) {
      await undoPickMembershipEffect(pick.membershipId, pick.result);
      await prisma.pick.delete({ where: { id: pick.id } });
      clearedMissed += 1;
    }
  } else if (action === "lock_now") {
    data = { lockOverrideAt: new Date(Date.now() - 1000), status: "locked" };
  } else if (action === "set" && lockAt) {
    data = { lockOverrideAt: new Date(lockAt) };
  } else if (action === "clear_override") {
    data = { lockOverrideAt: null };
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const updated = await prisma.week.update({
    where: { id: week.id },
    data,
  });

  let missed: string[] = [];
  if (action === "lock_now") {
    // Idempotent — safe if natural lock already applied
    const effects = await ensureWeekLockedEffects(week.id);
    missed = effects.missed;
  }

  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: `lock_${action}`,
      targetType: "week",
      targetId: week.id,
      details: JSON.stringify({
        weekNumber,
        lockAt: updated.lockAt,
        lockOverrideAt: updated.lockOverrideAt,
        missedApplied: missed.length,
        clearedMissed,
        note:
          action === "reopen"
            ? "Demo reopen: lockAt=+7d, override cleared, missedPicksAppliedAt cleared; MISS picks removed + losses undone"
            : undefined,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    week: updated,
    missed: missed.length,
    clearedMissed,
  });
}
