import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { sendPoolAnnouncement } from "@/lib/notification-events";

const MAX_LEN = 800;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Write a short pool note" }, { status: 400 });
  }
  if (message.length > MAX_LEN) {
    return NextResponse.json(
      { error: `Keep it to ${MAX_LEN} characters` },
      { status: 400 }
    );
  }

  const result = await sendPoolAnnouncement({
    poolId: admin.membership.poolId,
    actorId: admin.user.id,
    message,
  });
  return NextResponse.json({ ok: true, ...result });
}
