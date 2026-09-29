/** New-pool form checks. Pure — no database. */

export const POOL_NAME_MIN = 2;
export const POOL_NAME_MAX = 48;

export function parseNewPoolName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < POOL_NAME_MIN || name.length > POOL_NAME_MAX) return null;
  return name;
}

/** null = classic one mulligan. 1 = no mulligan from week 1. */
export function parseMulliganChoice(raw: unknown): number | null | undefined {
  if (raw == null || raw === "" || raw === "classic" || raw === "on") {
    return null;
  }
  if (raw === "none" || raw === "off") return 1;
  return undefined;
}
