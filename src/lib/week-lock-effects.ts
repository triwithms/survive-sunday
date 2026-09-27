import "server-only";
import { deferAfter } from "./defer-after";
import { ensureWeekLockedEffects } from "./grading";
import { enqueueWeekWork } from "./week-work-queue";

type LockEffectOptions = { applyBackup?: boolean };

/**
 * Keep missed-pick application and grading reliable without making a player
 * page wait for the writes. `after` maps to the request's Vercel waitUntil.
 * A failure is logged and never fails the page.
 */
export function deferWeekLockedEffects(
  weekId: string,
  opts?: LockEffectOptions
): void {
  deferAfter("week lock effects", () =>
    enqueueWeekWork(weekId, async () => {
      await ensureWeekLockedEffects(weekId, opts);
    })
  );
}
