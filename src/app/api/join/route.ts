import { NextResponse } from "next/server";
import { INVITE_CODE } from "@/lib/constants";
import { joinOrClaimSeat } from "@/lib/claim-seat-db";
import { consumeInviteToken, peekInviteToken } from "@/lib/invite-token-db";

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const inviteToken =
    typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";
  let membershipId =
    typeof body.membershipId === "string" ? body.membershipId : "";
  let inviteCode = typeof body.inviteCode === "string" ? body.inviteCode : "";

  if (inviteToken) {
    const peeked = await peekInviteToken(inviteToken).catch(() => null);
    if (!peeked) {
      return NextResponse.json(
        { error: "That invite link is invalid or expired." },
        { status: 400 }
      );
    }
    membershipId = peeked.membershipId;
    inviteCode = INVITE_CODE;
  }

  const result = await joinOrClaimSeat({
    inviteCode,
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
    membershipId,
    nickname: typeof body.nickname === "string" ? body.nickname : "",
    realName: typeof body.realName === "string" ? body.realName : "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (inviteToken) await consumeInviteToken(inviteToken).catch(() => false);

  return NextResponse.json({
    ok: true,
    membershipId: result.membershipId,
    email: result.email,
    claimed: result.claimed,
  });
}
