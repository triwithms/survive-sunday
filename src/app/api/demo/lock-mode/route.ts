import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, getMembershipForUser } from "@/lib/session";
import { INVITE_CODE } from "@/lib/constants";
import {
  ensureWeekLockedEffects,
  isWeekLocked,
  undoPickMembershipEffect,
} from "@/lib/grading";

/**
 * Demo/testing toggle: After lock | Before lock for the current week.
 * Allowed for any member of the SUNDAY26 demo pool (not admin-only).
 *
 * after_lock  — set lockOverrideAt to past (same as admin lock_now)
 * before_lock — clear override, reopen week status; undo demo MISS picks
 *               without rewriting the seeded lockAt (reversible)
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getMembershipForUser(user.id);
  if (!membership) {
    return NextResponse.json({ error: "No pool membership" }, { status: 403 });
  }
  if (membership.pool.inviteCode !== INVITE_CODE) {
    return NextResponse.json(
      { error: "Demo lock mode is only available on the demo pool" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const mode = body.mode as string | undefined;
  if (mode !== "after_lock" && mode !== "before_lock") {
    return NextResponse.json(
      { error: "mode must be after_lock or before_lock" },
      { status: 400 }
    );
  }

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: membership.poolId,
        number: membership.pool.currentWeek,
      },
    },
  });
  if (!week) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  let clearedMissed = 0;
  let missedApplied = 0;

  if (mode === "after_lock") {
    await prisma.week.update({
      where: { id: week.id },
      data: {
        lockOverrideAt: new Date(Date.now() - 1000),
        status: "locked",
      },
    });
    const effects = await ensureWeekLockedEffects(week.id);
    missedApplied = effects.missed.length;
  } else {
    // before_lock: clear override only — keep seeded lockAt intact
    const missedPicks = await prisma.pick.findMany({
      where: { weekId: week.id, source: "missed" },
    });
    for (const pick of missedPicks) {
      await undoPickMembershipEffect(pick.membershipId, pick.result);
      await prisma.pick.delete({ where: { id: pick.id } });
      clearedMissed += 1;
    }
    await prisma.week.update({
      where: { id: week.id },
      data: {
        lockOverrideAt: null,
        status: "open",
        missedPicksAppliedAt: null,
      },
    });
  }

  const updated = await prisma.week.findUniqueOrThrow({ where: { id: week.id } });

  await prisma.auditLog.create({
    data: {
      poolId: membership.poolId,
      actorId: user.id,
      action: `demo_lock_mode_${mode}`,
      targetType: "week",
      targetId: week.id,
      details: JSON.stringify({
        weekNumber: week.number,
        lockAt: updated.lockAt,
        lockOverrideAt: updated.lockOverrideAt,
        missedApplied,
        clearedMissed,
        note: "Demo testing toggle — reversible; seeded lockAt preserved on before_lock",
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    mode,
    locked: isWeekLocked(updated),
    weekNumber: updated.number,
    lockAt: updated.lockAt,
    lockOverrideAt: updated.lockOverrideAt,
    missedApplied,
    clearedMissed,
  });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getMembershipForUser(user.id);
  if (!membership || membership.pool.inviteCode !== INVITE_CODE) {
    return NextResponse.json({ demo: false });
  }

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: membership.poolId,
        number: membership.pool.currentWeek,
      },
    },
  });
  if (!week) return NextResponse.json({ demo: true, locked: true });

  return NextResponse.json({
    demo: true,
    locked: isWeekLocked(week),
    weekNumber: week.number,
    lockAt: week.lockAt,
    lockOverrideAt: week.lockOverrideAt,
  });
}
