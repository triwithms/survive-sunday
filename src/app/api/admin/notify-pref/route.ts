import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseNotifyPrefBody } from "@/lib/notify-pref";
import { saveNotifyPref } from "@/lib/notify-pref-db";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId =
    body && typeof body === "object" && "userId" in body
      ? String((body as { userId?: unknown }).userId ?? "")
      : "";
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const parsed = parseNotifyPrefBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const inPool = await prisma.membership.findFirst({
    where: { poolId: admin.membership.poolId, userId },
    select: { id: true },
  });
  if (!inPool) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pref = await saveNotifyPref(userId, parsed.pref);
  return NextResponse.json({ ok: true, pref });
}
