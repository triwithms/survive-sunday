/**
 * Runs on every Node server start (Vercel function cold start included).
 * Preview + production share Neon; main can put Membership_poolId_userId
 * unique back. Drop it here so Join attach does not wait for a one-off.
 * Also patch notification + pick-backup columns so Account pages do not
 * 500 when a build-time db push skipped additive tables.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
    const { prisma } = await import("@/lib/db");
    const { ensureDualMembershipIndex } = await import(
      "@/lib/membership-schema"
    );
    const { ensureNotificationTables } = await import(
      "@/lib/notification-schema"
    );
    const { ensureUserNotifyPref } = await import("@/lib/notify-pref-schema");
    const { ensurePickMirrorColumn } = await import(
      "@/lib/pick-mirror-schema"
    );
    const result = await ensureDualMembershipIndex(prisma);
    await ensurePickMirrorColumn(prisma);
    await ensureNotificationTables(prisma);
    await ensureUserNotifyPref(prisma);
    console.log(
      `[boot] schema ready${result.droppedUnique ? " (dropped leftover unique)" : ""}`
    );
  } catch (error) {
    console.error("[boot] schema ensure failed", error);
  }
}
