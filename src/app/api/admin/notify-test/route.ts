import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dispatchNotice } from "@/lib/notify-dispatch";
import { testGameCopy } from "@/lib/notify-test-copy";
import { requireAdmin } from "@/lib/session";

function summarize(
  outcomes: Array<{ channel: string; outcome: string }>
): string {
  if (outcomes.length === 0) return "Nothing to send.";
  return outcomes.map((o) => `${o.channel}: ${o.outcome}`).join(" · ");
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: admin.user.id },
    select: { id: true, email: true, phoneE164: true, notifyPref: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await dispatchNotice({
    target: {
      userId: user.id,
      email: user.email,
      phoneE164: user.phoneE164,
      notifyPref: user.notifyPref,
    },
    category: "game",
    type: "notifyTest",
    dedupeKey: `test:${user.id}:${Date.now()}`,
    content: testGameCopy(),
  });
  return NextResponse.json({
    ok: true,
    outcomes: result.outcomes,
    message: summarize(result.outcomes),
  });
}
