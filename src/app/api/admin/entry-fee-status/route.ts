import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  canSetPaymentStatus,
  isPaymentStatus,
  parsePaymentNote,
  statusChangeAudit,
} from "@/lib/payment-tracking";
import { requireAdmin } from "@/lib/session";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const poolId = admin.membership.poolId;
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { paymentTrackingEnabled: true },
  });
  if (!pool?.paymentTrackingEnabled) {
    return NextResponse.json(
      { error: "Entry fees are off for this pool." },
      { status: 400 }
    );
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Could not read that." }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  const membershipId = typeof record.membershipId === "string" ? record.membershipId : "";
  if (!membershipId || !isPaymentStatus(record.status)) {
    return NextResponse.json(
      { error: "Choose Unpaid, Paid, or Waived." },
      { status: 400 }
    );
  }
  const note = parsePaymentNote(record.note);
  if (!note.ok) return NextResponse.json({ error: note.error }, { status: 400 });

  const row = await prisma.membership.findFirst({
    where: { id: membershipId, poolId },
  });
  if (!row || !canSetPaymentStatus(poolId, row.poolId)) {
    return NextResponse.json(
      { error: "That player is not in this pool." },
      { status: 404 }
    );
  }
  const nextNote = record.note === undefined ? row.paymentNote : note.value;
  const statusChanged = row.paymentStatus !== record.status;
  const markedAt =
    record.status === "unpaid"
      ? null
      : statusChanged
        ? new Date()
        : row.paymentMarkedAt;
  const updated = await prisma.membership.update({
    where: { id: row.id },
    data: {
      paymentStatus: record.status,
      paymentNote: nextNote,
      paymentMarkedAt: markedAt,
    },
  });
  const audit = statusChangeAudit({
    nickname: row.nickname,
    beforeStatus: row.paymentStatus,
    afterStatus: updated.paymentStatus,
    beforeNote: row.paymentNote,
    afterNote: updated.paymentNote,
  });
  await prisma.auditLog.create({
    data: {
      poolId,
      actorId: admin.user.id,
      action: "entry_fee_status",
      targetType: "membership",
      targetId: row.id,
      details: JSON.stringify(audit),
    },
  });
  return NextResponse.json({
    ok: true,
    summary: audit.summary,
    status: updated.paymentStatus,
    note: updated.paymentNote,
    markedAt: updated.paymentMarkedAt?.toISOString() ?? null,
  });
}
