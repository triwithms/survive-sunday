import { NextResponse } from "next/server";
import { ACTIVE_POOL_COOKIE, activePoolCookieOptions, pickActivePoolId } from "@/lib/active-pool";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Switch the signed-in user's pool. The id must be one of their memberships. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { poolId?: unknown };
  const requested = typeof body.poolId === "string" ? body.poolId : "";
  const rows = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { poolId: true, createdAt: true },
  });
  const poolId = pickActivePoolId(rows, requested);
  if (!poolId || poolId !== requested.trim()) {
    return NextResponse.json({ error: "That pool is not yours" }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true, poolId });
  res.cookies.set(ACTIVE_POOL_COOKIE, poolId, activePoolCookieOptions());
  return res;
}
