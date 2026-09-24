import "server-only";
import { after } from "next/server";
import { ensureWeekLockedEffects } from "./grading";

type LockEffectOptions = { applyBackup?: boolean };

/**
 * Keep missed-pick application and grading reliable without making a player
 * page wait for the writes. `after` maps to the request's Vercel waitUntil.
 */
export function deferWeekLockedEffects(
  weekId: string,
  opts?: LockEffectOptions
): void {
  const run = async () => {
    try {
      await ensureWeekLockedEffects(weekId, opts);
    } catch (error) {
      console.error("deferred week lock effects failed", weekId, error);
    }
  };

  try {
    after(run);
  } catch (error) {
    console.error("after() unavailable for week lock effects", error);
    void run();
  }
}
