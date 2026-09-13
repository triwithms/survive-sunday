import type { PrismaClient } from "@prisma/client";

/**
 * Canonical real names for BM Boys seats that were seeded with leftovers.
 * Changing seed files does not update an already-created production pool.
 */
export type RosterNameFix = {
  nickname: string;
  realName: string;
  /** Prior leftover values we always replace (case/spacing-insensitive). */
  stale: string[];
};

export const ROSTER_NAME_FIXES: RosterNameFix[] = [
  {
    nickname: "Long Snapper",
    realName: "John Stilo",
    stale: ["J S", "JS", "J.S.", "J. S.", "Long Snapper"],
  },
  {
    nickname: "Steve",
    realName: "Steve Venerus",
    stale: ["Steve"],
  },
  {
    nickname: "Gdogss",
    realName: "Tony Gyuro",
    stale: ["Gdogss"],
  },
];

export const ROSTER_NAME_PATCH_AUDIT = "roster_canonical_names_patched";

export function normalizePersonName(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ");
}

export function shouldReplaceRealName(
  current: string | null | undefined,
  fix: RosterNameFix,
  forceIfNotCanonical: boolean
): boolean {
  const currentNorm = normalizePersonName(current);
  const canonicalNorm = normalizePersonName(fix.realName);
  if (currentNorm === canonicalNorm) return false;
  if (forceIfNotCanonical) return true;
  if (!currentNorm) return true;
  return fix.stale.some((s) => normalizePersonName(s) === currentNorm);
}

export type RosterPatchResult = {
  updated: { nickname: string; from: string | null; to: string }[];
};

/**
 * Update leftover production real names by nickname.
 * First successful run force-sets the known seats; later runs only
 * replace empty / stale leftovers so a later Roster edit is kept.
 */
export async function applyCanonicalRosterNames(
  db: PrismaClient,
  poolId: string,
  opts: { force?: boolean } = {}
): Promise<RosterPatchResult> {
  const already = await db.auditLog.findFirst({
    where: { poolId, action: ROSTER_NAME_PATCH_AUDIT },
    select: { id: true },
  });
  const forceIfNotCanonical = Boolean(opts.force) || !already;

  const members = await db.membership.findMany({
    where: {
      poolId,
      nickname: { in: ROSTER_NAME_FIXES.map((f) => f.nickname) },
    },
    select: { id: true, nickname: true, realName: true, userId: true },
  });

  const updated: RosterPatchResult["updated"] = [];

  for (const member of members) {
    const fix = ROSTER_NAME_FIXES.find((f) => f.nickname === member.nickname);
    if (!fix) continue;
    if (!shouldReplaceRealName(member.realName, fix, forceIfNotCanonical)) {
      continue;
    }
    await db.membership.update({
      where: { id: member.id },
      data: { realName: fix.realName },
    });
    const user = await db.user.findUnique({
      where: { id: member.userId },
      select: { id: true, name: true },
    });
    if (
      user &&
      shouldReplaceRealName(user.name, { ...fix, stale: [...fix.stale, member.realName ?? ""] }, true)
    ) {
      // Only overwrite user.name when it still looks like the leftover, not a later edit.
      if (
        shouldReplaceRealName(user.name, fix, false) ||
        normalizePersonName(user.name) === normalizePersonName(member.realName)
      ) {
        await db.user.update({
          where: { id: user.id },
          data: { name: fix.realName },
        });
      }
    }
    updated.push({
      nickname: member.nickname,
      from: member.realName,
      to: fix.realName,
    });
  }

  if (!already) {
    await db.auditLog.create({
      data: {
        poolId,
        action: ROSTER_NAME_PATCH_AUDIT,
        targetType: "pool",
        targetId: poolId,
        details: JSON.stringify({
          updated,
          note: "Production real-name patch (not seed-only)",
        }),
      },
    });
  }

  return { updated };
}

let lastPatchAt = 0;
let inflight: Promise<RosterPatchResult> | null = null;

/** At most once a minute per server instance (covers serverless warm instances). */
export async function applyCanonicalRosterNamesThrottled(
  db: PrismaClient,
  poolId: string
): Promise<RosterPatchResult | { skipped: true }> {
  if (Date.now() - lastPatchAt < 60_000) return { skipped: true };
  if (inflight) return inflight;
  inflight = applyCanonicalRosterNames(db, poolId)
    .catch((error) => {
      console.warn("[roster-name-patch] skipped", error);
      return { updated: [] };
    })
    .finally(() => {
      inflight = null;
      lastPatchAt = Date.now();
    });
  return inflight;
}
