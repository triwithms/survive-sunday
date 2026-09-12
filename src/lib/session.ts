import { auth } from "./auth";
import { prisma } from "./db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getMembershipForUser(userId: string) {
  return prisma.membership.findFirst({
    where: { userId },
    include: {
      pool: true,
      user: true,
      picks: { include: { game: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;
  const m = await getMembershipForUser(user.id);
  if (!m || m.role !== "admin") return null;
  return { user, membership: m };
}
