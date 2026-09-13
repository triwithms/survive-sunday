import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendTwoFactorCode } from "@/lib/two-factor-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.twoFactorPending) {
    return NextResponse.json({ error: "Two-factor is not required." }, { status: 400 });
  }

  let channel: unknown;
  try {
    const body = (await req.json()) as { channel?: unknown };
    channel = body.channel;
  } catch {
    channel = undefined;
  }

  const result = await sendTwoFactorCode(
    { id: session.user.id, email: session.user.email },
    channel
  );

  if (!result.ok) {
    const status = /too many/i.test(result.error) ? 429 : 400;
    return NextResponse.json(
      { error: result.error, ...(result.status ? { status: result.status } : {}) },
      { status }
    );
  }

  return NextResponse.json({ ok: true, ...result.status });
}
