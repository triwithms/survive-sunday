/**
 * Runs on every Node server start (Vercel function cold start included).
 * Preview + production share Neon; main can put Membership_poolId_userId
 * unique back. Drop it here so Join attach does not wait for a one-off.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
    const { prisma } = await import("@/lib/db");
    const { ensureDualMembershipIndex } = await import(
      "@/lib/membership-schema"
    );
    const result = await ensureDualMembershipIndex(prisma);
    console.log(
      `[boot] dual membership index ready${result.droppedUnique ? " (dropped leftover unique)" : ""}`
    );
  } catch (error) {
    console.error("[boot] ensureDualMembershipIndex failed", error);
  }
}
