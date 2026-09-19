import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parsePreferencePatch } from "@/lib/notification-types";
import { loadNotifyPref } from "@/lib/notify-pref-db";
import { saveNotifyState } from "@/lib/notify-pref-save";
import { requireAdmin } from "@/lib/session";

async function memberInPool(poolId: string, userId: string) {
  return prisma.membership.findFirst({
    where: { poolId, userId },
    select: { id: true },
  });
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = new URL(req.url).searchParams.get("userId") ?? "";
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (!(await memberInPool(admin.membership.poolId, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const loaded = await loadNotifyPref(userId);
  return NextResponse.json({ ok: true, prefs: loaded.prefs });
}

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
  const loaded = await loadNotifyPref(userId);
  const parsed = parsePreferencePatch(body, loaded.prefs);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (!(await memberInPool(admin.membership.poolId, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const prefs = await saveNotifyState(userId, parsed.prefs);
  return NextResponse.json({ ok: true, prefs });
}
