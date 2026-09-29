/** Which pool a signed-in user is looking at. Pure — no database. */

export const ACTIVE_POOL_COOKIE = "ss-active-pool";

export type PoolChoice = {
  id: string;
  name: string;
};

type MembershipPoolRow = {
  poolId: string;
  createdAt: Date | string;
  pool?: { name: string };
};

export function activePoolCookieOptions() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}

/** Oldest membership first. One row per pool. */
export function poolChoicesFromMemberships(
  rows: MembershipPoolRow[]
): PoolChoice[] {
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const seen = new Set<string>();
  const out: PoolChoice[] = [];
  for (const row of sorted) {
    if (seen.has(row.poolId)) continue;
    seen.add(row.poolId);
    out.push({ id: row.poolId, name: row.pool?.name ?? "Pool" });
  }
  return out;
}

/**
 * Cookie is a preference only. A pool id the user does not belong to
 * is ignored and the oldest membership wins (the live pool for existing
 * family-pool logins).
 */
export function pickActivePoolId(
  rows: MembershipPoolRow[],
  requested: string | null | undefined
): string | null {
  const choices = poolChoicesFromMemberships(rows);
  if (!choices.length) return null;
  const wanted = (requested ?? "").trim();
  if (wanted && choices.some((pool) => pool.id === wanted)) return wanted;
  return choices[0].id;
}
