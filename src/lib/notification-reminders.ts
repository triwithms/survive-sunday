import { applyMirrorPicksForActiveWeeks } from "./pick-mirror-db";
import { writeMissingPickAudit } from "./missing-pick-audit";
import { loadRemindWeeks, membershipHasPick } from "./missing-pick-load";
import { remindAfterRecheck, type RemindMode } from "./missing-pick-who";
import { missingPickCopy, notifyUser } from "./notify";

export async function sendMissingPickReminders(opts?: {
  poolId?: string;
  weekId?: string;
  now?: Date;
  mode?: RemindMode;
  actorId?: string | null;
  /** When set, remind only this seat. Omit to remind every blank. */
  membershipId?: string;
}): Promise<{
  reminded: number;
  skipped: number;
  mirrored: number;
  alreadyPicked: number;
  nicknames: string[];
}> {
  const now = opts?.now ?? new Date();
  const mode: RemindMode = opts?.mode ?? "cron";
  const mirrored = await applyMirrorPicksForActiveWeeks(now);
  const weeks = await loadRemindWeeks({
    poolId: opts?.poolId,
    weekId: opts?.weekId,
    now,
    mode,
  });
  let reminded = 0;
  let skipped = 0;
  let alreadyPicked = 0;
  const nicknames: string[] = [];

  for (const week of weeks) {
    for (const seat of week.blanks) {
      if (opts?.membershipId && seat.membershipId !== opts.membershipId) continue;
      const exists = await membershipHasPick(seat.membershipId, week.id);
      if (!remindAfterRecheck(exists)) {
        alreadyPicked += 1;
        continue;
      }
      const result = await notifyUser({
        target: {
          userId: seat.userId,
          email: seat.email,
          phoneE164: seat.phoneE164,
          notifyPref: seat.notifyPref,
          nickname: seat.nickname,
        },
        type: "missingPickReminder",
        content: missingPickCopy({
          nickname: seat.nickname,
          weekNumber: week.number,
          lockLabel: week.lockLabel,
        }),
        dedupeKey: week.id,
      });
      nicknames.push(seat.nickname);
      if (result.emailed || result.texted) reminded += 1;
      else skipped += 1;
    }
  }

  if (mode === "admin" && opts?.poolId && opts.actorId) {
    await writeMissingPickAudit({
      poolId: opts.poolId,
      actorId: opts.actorId,
      weeks: weeks.map((week) => week.number),
      reminded,
      skipped,
      alreadyPicked,
      nicknames,
    });
  }

  return {
    reminded,
    skipped,
    mirrored: mirrored.copied,
    alreadyPicked,
    nicknames,
  };
}
