/**
 * Pure rules for deleting one pool. No database.
 * The active-pool administrator must type that pool's name.
 * Afterward, stay on a remaining pool (family / live first).
 * No remaining pool means sign out — the login itself stays.
 */

export type PoolAfterDelete = {
  id: string;
  createdAt: Date | string;
  inviteCode: string;
  mode: string;
  /** Null when this pool owns its NFL games. */
  slatePoolId: string | null;
};

const SLATE_NAMES_SHOWN = 5;

/** Exact pool name, ends trimmed. Empty names never match. */
export function poolNameConfirmMatches(typed: string, poolName: string): boolean {
  const name = poolName.trim();
  if (!name) return false;
  return typed.trim() === name;
}

export function slateOwnerDeleteBlock(names: string[]): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  let listed = "other pools";
  if (clean.length > 0 && clean.length <= SLATE_NAMES_SHOWN) {
    listed = clean.join(", ");
  } else if (clean.length > SLATE_NAMES_SHOWN) {
    const shown = clean.slice(0, SLATE_NAMES_SHOWN).join(", ");
    listed = `${shown}, and ${clean.length - SLATE_NAMES_SHOWN} more`;
  }
  return `Other pools still use this pool for the NFL schedule (${listed}). It was not deleted.`;
}

export const EXTERNAL_PICKS_DELETE_BLOCK =
  "Other pools still have picks on this pool’s games. It was not deleted.";

function oldest(rows: PoolAfterDelete[]): PoolAfterDelete | undefined {
  return [...rows].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )[0];
}

/**
 * Pool to open after this one is gone.
 * Family invite code first, then the oldest live slate owner,
 * then the oldest live pool, then the oldest remaining pool.
 * Null means this login is in no pool — sign them out.
 */
export function preferredPoolAfterDelete(
  remaining: PoolAfterDelete[],
  familyInviteCode: string
): string | null {
  const byId = new Map<string, PoolAfterDelete>();
  for (const pool of remaining) {
    if (!byId.has(pool.id)) byId.set(pool.id, pool);
  }
  const pools = [...byId.values()];
  if (!pools.length) return null;
  const family = pools.find((pool) => pool.inviteCode === familyInviteCode);
  if (family) return family.id;
  const liveOwner = oldest(
    pools.filter((pool) => pool.mode === "live" && !pool.slatePoolId)
  );
  if (liveOwner) return liveOwner.id;
  const live = oldest(pools.filter((pool) => pool.mode === "live"));
  if (live) return live.id;
  return oldest(pools)?.id ?? null;
}
