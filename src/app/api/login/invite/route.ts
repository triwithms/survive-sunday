import { NextResponse } from "next/server";
import { loadInvitePrefill } from "@/lib/invite-prefill-db";

/** Peek an invite token. Never starts a session. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const prefill = await loadInvitePrefill(token);
  if (!prefill) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    email: prefill.email,
    nickname: prefill.nickname,
  });
}
