import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { gradeWeekPicks, applyMissedPicks, ensureWeekLockedEffects } from "@/lib/grading";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { weekNumber, applyMissed } = await req.json();
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: admin.membership.poolId,
        number: weekNumber ?? 1,
      },
    },
  });
  if (!week) return NextResponse.json({ error: "Week not found" }, { status: 404 });

  // Ensure lock effects first (idempotent missed picks)
  await ensureWeekLockedEffects(week.id);

  const graded = await gradeWeekPicks(week.id);
  let missed: string[] = [];
  if (applyMissed) {
    missed = await applyMissedPicks(week.id);
  }

  await prisma.week.update({
    where: { id: week.id },
    data: { status: "graded" },
  });

  await prisma.auditLog.create({
    data: {
      poolId: admin.membership.poolId,
      actorId: admin.user.id,
      action: "force_grade",
      targetType: "week",
      targetId: week.id,
      details: JSON.stringify({ graded: graded.length, missed: missed.length }),
    },
  });

  return NextResponse.json({ ok: true, graded: graded.length, missed: missed.length });
}
