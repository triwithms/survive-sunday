import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { setMemberTemporaryPassword } from "@/lib/admin-set-password";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    membershipId?: unknown;
    confirmNickname?: unknown;
    password?: unknown;
  };
  const membershipId =
    typeof body.membershipId === "string" ? body.membershipId : "";
  const confirmNickname =
    typeof body.confirmNickname === "string" ? body.confirmNickname : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = await setMemberTemporaryPassword({
    db: prisma,
    poolId: admin.membership.poolId,
    actorId: admin.user.id,
    membershipId,
    confirmNickname,
    password,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    nickname: result.nickname,
    emailMasked: result.emailMasked,
  });
}
