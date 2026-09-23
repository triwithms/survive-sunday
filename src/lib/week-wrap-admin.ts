import { prisma } from "./db";
import {
  loadWeekWrapSettings,
  saveWeekWrapSettings,
} from "./week-wrap-settings";
import { sendWeekWrap, weekWrapSendMessage } from "./week-wrap-send";
import {
  withSkippedWeek,
  type WeekWrapRequest,
} from "./week-wrap-types";

export async function applyWeekWrapAction(opts: {
  poolId: string;
  actorId: string;
  request: WeekWrapRequest;
}): Promise<
  | { ok: true; message: string; skipped: boolean; sent: boolean }
  | { ok: false; error: string }
> {
  const { request } = opts;
  const current = await loadWeekWrapSettings(opts.poolId);
  let skippedWeeks = current.skippedWeeks;
  if (request.action === "skip") {
    skippedWeeks = withSkippedWeek(current.skippedWeeks, request.weekNumber, true);
  } else if (request.action === "send") {
    skippedWeeks = withSkippedWeek(current.skippedWeeks, request.weekNumber, false);
  }
  await saveWeekWrapSettings(opts.poolId, {
    tone: request.tone,
    blocks: request.blocks,
    emailOverride: request.emailOverride,
    smsOverride: request.smsOverride,
    skippedWeeks,
  });

  if (request.action === "save") {
    return {
      ok: true,
      message: "Saved. The next automatic wrap uses these defaults.",
      skipped: skippedWeeks.includes(request.weekNumber),
      sent: false,
    };
  }

  if (request.action === "skip") {
    await prisma.auditLog.create({
      data: {
        poolId: opts.poolId,
        actorId: opts.actorId,
        action: "week_wrap_skipped",
        targetType: "week",
        targetId: String(request.weekNumber),
        details: JSON.stringify({
          summary: `Week ${request.weekNumber} skipped`,
        }),
      },
    });
    return {
      ok: true,
      message: `Week ${request.weekNumber} will not send automatically.`,
      skipped: true,
      sent: false,
    };
  }

  const result = await sendWeekWrap(
    opts.poolId,
    request.weekNumber,
    opts.actorId
  );
  if (!result.ok) return result;
  return {
    ok: true,
    message: weekWrapSendMessage(result.counts),
    skipped: false,
    sent: true,
  };
}
