import { NextResponse } from "next/server";
import {
  ACTIVE_POOL_COOKIE,
  activePoolCookieOptions,
} from "@/lib/active-pool";
import { deleteActivePool } from "@/lib/delete-pool";
import { requireAdmin } from "@/lib/session";

/** Delete the pool this administrator is in. Other pools stay. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    confirm?: unknown;
    poolId?: unknown;
  };
  const confirm = typeof body.confirm === "string" ? body.confirm : "";
  const requested = typeof body.poolId === "string" ? body.poolId.trim() : "";
  const poolId = admin.membership.poolId;
  if (requested && requested !== poolId) {
    return NextResponse.json(
      { error: "Switch to that pool, then delete it." },
      { status: 409 }
    );
  }

  const result = await deleteActivePool({
    poolId,
    actorUserId: admin.user.id,
    confirmName: confirm,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const res = NextResponse.json({
    ok: true,
    signedOut: result.nextPoolId === null,
    nextPoolId: result.nextPoolId,
  });
  if (result.nextPoolId) {
    res.cookies.set(
      ACTIVE_POOL_COOKIE,
      result.nextPoolId,
      activePoolCookieOptions()
    );
  } else {
    res.cookies.set(ACTIVE_POOL_COOKIE, "", {
      ...activePoolCookieOptions(),
      maxAge: 0,
    });
  }
  return res;
}
