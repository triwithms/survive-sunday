import { payloadHash } from "@/lib/payload-hash";
import type { LiveInjury } from "@/lib/injury-parse";

/** Content identity for the ESPN injury list (ignore fetch timestamps). */
export function injuryFingerprint(rows: LiveInjury[]): string {
  return payloadHash(
    [...rows]
      .map((r) => `${r.teamAbbr}|${r.player}|${r.position}|${r.status}|${r.injury}`)
      .sort()
  );
}
