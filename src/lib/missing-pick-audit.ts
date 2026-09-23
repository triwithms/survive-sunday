import { prisma } from "./db";
import { MISSING_PICK_AUDIT } from "./missing-pick-who";

export async function writeMissingPickAudit(opts: {
  poolId: string;
  actorId: string;
  weeks: number[];
  reminded: number;
  skipped: number;
  alreadyPicked: number;
  nicknames: string[];
}): Promise<void> {
  const week = opts.weeks.length ? opts.weeks.join(", ") : "—";
  const who = opts.nicknames.length ? opts.nicknames.join(", ") : "none";
  await prisma.auditLog.create({
    data: {
      poolId: opts.poolId,
      actorId: opts.actorId,
      action: MISSING_PICK_AUDIT,
      targetType: "pool",
      targetId: opts.poolId,
      details: JSON.stringify({
        summary: `Week ${week}: ${opts.reminded} reminded, ${opts.skipped} skipped, ${opts.alreadyPicked} already picked. ${who}`,
        reminded: opts.reminded,
        skipped: opts.skipped,
        alreadyPicked: opts.alreadyPicked,
        nicknames: opts.nicknames,
        weeks: opts.weeks,
      }),
    },
  });
}
