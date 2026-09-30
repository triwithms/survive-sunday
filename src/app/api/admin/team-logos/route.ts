import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import {
  showTeamLogosFor,
  teamLogosAuditSummary,
  teamLogosForcedOff,
} from "@/lib/team-logos";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { showTeamLogos?: unknown } | null;
  if (typeof body?.showTeamLogos !== "boolean") {
    return NextResponse.json({ error: "Could not read that." }, { status: 400 });
  }
  const next = body.showTeamLogos;
  const poolId = admin.membership.poolId;
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { showTeamLogos: true },
  });
  if (!pool) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const before = showTeamLogosFor(pool.showTeamLogos, {});
  const summary = teamLogosAuditSummary(next);
  if (before !== next) {
    await prisma.pool.update({ where: { id: poolId }, data: { showTeamLogos: next } });
    await prisma.auditLog.create({
      data: {
        poolId,
        actorId: admin.user.id,
        action: "pool_team_logos",
        targetType: "pool",
        targetId: poolId,
        details: JSON.stringify({ summary, before, after: next }),
      },
    });
  }
  return NextResponse.json({
    ok: true,
    showTeamLogos: next,
    forcedOff: teamLogosForcedOff(),
    summary,
  });
}
