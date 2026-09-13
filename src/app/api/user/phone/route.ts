import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeToE164 } from "@/lib/phone";
import { isSessionReady } from "@/lib/session";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!isSessionReady(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { phone?: unknown; skip?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Soft-prompt skip — remember so we don’t ask again every login
  if (body.skip === true) {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { phoneSkippedAt: new Date() },
      select: { phoneE164: true, phoneSkippedAt: true },
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      phoneE164: updated.phoneE164,
      phoneSkippedAt: updated.phoneSkippedAt?.toISOString() ?? null,
    });
  }

  if (typeof body.phone !== "string") {
    return NextResponse.json(
      { error: "Provide a phone number or skip: true" },
      { status: 400 }
    );
  }

  const phoneE164 = normalizeToE164(body.phone);
  if (!phoneE164) {
    return NextResponse.json(
      {
        error:
          "Enter a valid Canadian or US number, e.g. (416) 951-4262 or +1…",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      phoneE164,
      phoneSkippedAt: null, // clear skip once saved
    },
    select: { phoneE164: true, phoneSkippedAt: true },
  });

  return NextResponse.json({
    ok: true,
    phoneE164: updated.phoneE164,
    phoneSkippedAt: updated.phoneSkippedAt?.toISOString() ?? null,
  });
}

export async function POST(req: Request) {
  return PATCH(req);
}
