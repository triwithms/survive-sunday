import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ensureWeekLockedEffects } from "@/lib/grading";

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
    lockOverrideAt?: Date | null;
    status?: string;
    missedPicksAppliedAt?: Date | null;
  } = {};
  if (action === "unlock") {
    // Push lock into the future for testing
    const future = new Date();
    future.setDate(future.getDate() + 7);
    data = { lockOverrideAt: future, status: "open" };
  } else if (action === "lock_now") {
    data = { lockOverrideAt: new Date(Date.now() - 1000), status: "locked" };
  } else if (action === "set" && lockAt) {
    data = { lockOverrideAt: new Date(lockAt) };
  } else if (action === "clear_override") {
    data = { lockOverrideAt: null };
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
        lockOverrideAt: updated.lockOverrideAt,
        missedApplied: missed.length,
      }),
    },
  });

  return NextResponse.json({ ok: true, week: updated, missed: missed.length });
}
