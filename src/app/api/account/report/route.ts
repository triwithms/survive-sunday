import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deliverFeedbackAdminNotice } from "@/lib/feedback-admin-alert";
import { parseFeedbackMessage } from "@/lib/feedback-admin-copy";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to send a report." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseFeedbackMessage(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const email = (user.email ?? session.user.email ?? "").trim();
  const result = await deliverFeedbackAdminNotice({
    userId: user.id,
    email,
    message: parsed.message,
  });
  if (result.notified === 0) {
    return NextResponse.json(
      { error: "No Administrators to notify. Try again later." },
      { status: 503 }
    );
  }
  return NextResponse.json({
    ok: true,
    notified: result.notified,
    message: "Thanks — we sent your note to the Administrators.",
  });
}
