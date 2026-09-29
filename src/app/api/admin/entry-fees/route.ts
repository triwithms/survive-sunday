import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  parseEntryFeeCents,
  parseEntryFeeCurrency,
  parsePaymentInstructions,
  parsePaymentLink,
  settingsChangeAudit,
  type EntryFeeSettings,
} from "@/lib/payment-tracking";
import { requireAdmin } from "@/lib/session";

function snapshot(pool: {
  paymentTrackingEnabled: boolean;
  entryFeeCents: number | null;
  entryFeeCurrency: string;
  paymentInstructions: string | null;
  paymentLink: string | null;
}): EntryFeeSettings {
  return {
    enabled: pool.paymentTrackingEnabled,
    entryFeeCents: pool.entryFeeCents,
    currency: pool.entryFeeCurrency,
    instructions: pool.paymentInstructions,
    link: pool.paymentLink,
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const pool = await prisma.pool.findUnique({
    where: { id: admin.membership.poolId },
  });
  if (!pool) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, ...snapshot(pool) });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Could not read that." }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  const instructions = parsePaymentInstructions(record.instructions);
  if (!instructions.ok) {
    return NextResponse.json({ error: instructions.error }, { status: 400 });
  }
  const link = parsePaymentLink(record.link);
  if (!link.ok) return NextResponse.json({ error: link.error }, { status: 400 });
  const cents = parseEntryFeeCents(record.entryFee);
  if (!cents.ok) return NextResponse.json({ error: cents.error }, { status: 400 });

  const poolId = admin.membership.poolId;
  const beforeRow = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!beforeRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const before = snapshot(beforeRow);
  const after: EntryFeeSettings = {
    enabled: record.enabled === true,
    entryFeeCents: cents.value,
    currency: parseEntryFeeCurrency(record.currency),
    instructions: instructions.value,
    link: link.value,
  };
  const updated = await prisma.pool.update({
    where: { id: poolId },
    data: {
      paymentTrackingEnabled: after.enabled,
      entryFeeCents: after.entryFeeCents,
      entryFeeCurrency: after.currency,
      paymentInstructions: after.instructions,
      paymentLink: after.link,
    },
  });
  const audit = settingsChangeAudit(before, snapshot(updated));
  await prisma.auditLog.create({
    data: {
      poolId,
      actorId: admin.user.id,
      action: "entry_fee_settings",
      targetType: "pool",
      targetId: poolId,
      details: JSON.stringify(audit),
    },
  });
  return NextResponse.json({ ok: true, summary: audit.summary, ...snapshot(updated) });
}
