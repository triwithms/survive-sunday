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
    const { ensureWeekWrapTable } = await import("@/lib/week-wrap-schema");
    const { ensureServerErrorTable } = await import(
      "@/lib/server-error-schema"
    );
    const { ensurePickMirrorColumn } = await import(
      "@/lib/pick-mirror-schema"
    );
    const result = await ensureDualMembershipIndex(prisma);
    await ensurePickMirrorColumn(prisma);
    await ensureNotificationTables(prisma);
    await ensureUserNotifyPref(prisma);
    await ensureWeekWrapTable(prisma);
    await ensureServerErrorTable(prisma);
    console.log(
      `[boot] schema ready${result.droppedUnique ? " (dropped leftover unique)" : ""}`
    );
  } catch (error) {
    console.error("[boot] schema ensure failed", error);
  }
}

type RequestErrorContext = {
  path?: string;
  method?: string;
};

type RequestErrorMeta = {
  routePath?: string;
  routeType?: string;
};

/** Keeps the error page's message after Vercel Hobby drops function logs. */
export async function onRequestError(
  error: unknown,
  request: RequestErrorContext,
  context: RequestErrorMeta
) {
  try {
    const { recordServerError } = await import("@/lib/server-error-log");
    const message = error instanceof Error ? error.message : String(error);
    const digest =
      error && typeof error === "object" && "digest" in error
        ? String((error as { digest?: unknown }).digest ?? "")
        : "";
    const route = [request?.method, context?.routePath || request?.path]
      .filter(Boolean)
      .join(" ");
    await recordServerError({
      route: route || "request",
      message,
      digest: digest || null,
      source: context?.routeType || "request",
    });
  } catch (logError) {
    console.error("[server-error] onRequestError failed", logError);
  }
}
