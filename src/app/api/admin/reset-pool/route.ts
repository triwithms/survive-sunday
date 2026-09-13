import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { RESET_POOL_CONFIRM } from "@/lib/constants";
import { poolHasRealCommissioner } from "@/lib/pool-mode-db";
import { previewPoolReset, resetPoolSeasonData } from "@/lib/reset-pool";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const preview = await previewPoolReset(
    admin.membership.poolId,
    admin.user.id
  );
  if (!preview) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, ...preview });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const confirm = typeof body.confirm === "string" ? body.confirm.trim() : "";
  if (confirm !== RESET_POOL_CONFIRM) {
    return NextResponse.json(
      { error: `Type ${RESET_POOL_CONFIRM} to confirm` },
      { status: 400 }
    );
  }

  const switchToLive = body.switchToLive !== false;
  if (switchToLive) {
    const ready = await poolHasRealCommissioner(admin.membership.poolId);
    if (!ready) {
      return NextResponse.json(
        {
          error:
            "Set your real commissioner login first. Then reset and switch to Real mode.",
        },
        { status: 400 }
      );
    }
  }

  try {
    const result = await resetPoolSeasonData({
      poolId: admin.membership.poolId,
      actorUserId: admin.user.id,
      switchToLive,
      confirm,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
