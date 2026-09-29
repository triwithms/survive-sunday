import { NextResponse } from "next/server";
import { ACTIVE_POOL_COOKIE, activePoolCookieOptions } from "@/lib/active-pool";
import { joinViaPoolInvite } from "@/lib/pool-invite-join";

/** Self-serve join. Pool comes from the token hash, never from the body. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await joinViaPoolInvite(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const res = NextResponse.json({ ok: true, email: result.email });
  res.cookies.set(ACTIVE_POOL_COOKIE, result.poolId, activePoolCookieOptions());
  return res;
}
