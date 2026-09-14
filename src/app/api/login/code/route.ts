import { NextResponse } from "next/server";
import { requestSignInCode } from "@/lib/signin-otp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  let email = "";
  let channel: unknown;
  try {
    const body = (await req.json()) as { email?: unknown; channel?: unknown };
    email = typeof body.email === "string" ? body.email : "";
    channel = body.channel;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await requestSignInCode(email, channel);
  if (!result.ok) {
    const status = /too many/i.test(result.error) ? 429 : 400;
    return NextResponse.json(
      { error: result.error, ...(result.status ? { status: result.status } : {}) },
      { status }
    );
  }

  return NextResponse.json({
    ok: true,
    demo: Boolean(result.demo),
    ...(result.message ? { message: result.message } : {}),
    ...(result.status ? result.status : {}),
  });
}
