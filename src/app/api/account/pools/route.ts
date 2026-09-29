import { NextResponse } from "next/server";
import { ACTIVE_POOL_COOKIE, activePoolCookieOptions } from "@/lib/active-pool";
import { createOrganizerPool } from "@/lib/create-pool";
import { ROLE_VIEW_COOKIE } from "@/lib/roles";
import { requireUser } from "@/lib/session";

/** Start a pool. The creator becomes its administrator. Does not touch other pools. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    name?: unknown;
    mulligan?: unknown;
    startWeek?: unknown;
  };
  const result = await createOrganizerPool({
    userId: user.id,
    name: body.name,
    mulligan: body.mulligan,
    startWeek: body.startWeek,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, poolId: result.poolId, name: result.name });
  const cookie = activePoolCookieOptions();
  res.cookies.set(ACTIVE_POOL_COOKIE, result.poolId, cookie);
  res.cookies.set(ROLE_VIEW_COOKIE, "admin", cookie);
  return res;
}
