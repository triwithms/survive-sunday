import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { joinOrClaimSeat } from "@/lib/claim-seat-db";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const session = await auth();
  const result = await joinOrClaimSeat({
    inviteCode: typeof body.inviteCode === "string" ? body.inviteCode : "",
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
    membershipId: typeof body.membershipId === "string" ? body.membershipId : "",
    nickname: typeof body.nickname === "string" ? body.nickname : "",
    realName: typeof body.realName === "string" ? body.realName : "",
    sessionUserId: session?.user?.id,
    sessionEmail: session?.user?.email ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    membershipId: result.membershipId,
    email: result.email,
    claimed: result.claimed,
  });
}
