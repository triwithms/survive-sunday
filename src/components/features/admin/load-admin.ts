import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getUserPoolContext } from "@/lib/session";

export async function loadAdminGate() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const ctx = await getUserPoolContext(userId);
  const me = ctx.membership;
  if (!me) redirect("/join");
  if (!ctx.isAdmin) {
    return { ok: false as const, me, session, userId, isDemo: false };
  }
  return { ok: true as const, me, session, ctx, userId, isDemo: false };
}

export async function loadPoolMembers(poolId: string) {
  return prisma.membership.findMany({
    where: { poolId },
    include: { user: { select: { email: true } } },
    orderBy: { nickname: "asc" },
  });
}
