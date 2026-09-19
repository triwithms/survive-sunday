export type LastGoodEntry<T> = {
  value: T;
  hash: string;
  fetchedAt: number;
  lastAttempt: number;
  failed: boolean;
};

export type LastGoodServePlan = "fresh" | "fail-wait" | "swr" | "await";

export function scoreboardTtlMs(
  hasLive: boolean,
  liveTtlMs: number,
  slateTtlMs: number
): number {
  return hasLive ? liveTtlMs : slateTtlMs;
}

/** Decide whether to reuse last-good, wait after a fail, SWR, or block on fetch. */
export function lastGoodServePlan(
  entry: LastGoodEntry<unknown> | null | undefined,
  now: number,
  ttlMs: number,
  failTtlMs: number,
  swrMs: number
): LastGoodServePlan {
  if (!entry) return "await";
  if (entry.failed) {
    return now - entry.lastAttempt < failTtlMs ? "fail-wait" : "await";
  }
  if (now - entry.fetchedAt < ttlMs) return "fresh";
  if (now - entry.lastAttempt < failTtlMs) return "fail-wait";
  if (now - entry.fetchedAt < swrMs) return "swr";
  return "await";
}

export function rememberLastGood<T>(
  prev: LastGoodEntry<T> | null | undefined,
  incoming: { value: T; hash: string; failed: boolean },
  now: number,
  replaceIfSameHash = false
): LastGoodEntry<T> {
  if (incoming.failed) {
    if (prev && !prev.failed) return { ...prev, lastAttempt: now };
    return {
      value: incoming.value,
      hash: incoming.hash,
      fetchedAt: now,
      lastAttempt: now,
      failed: true,
    };
  }
  const same = Boolean(prev && !prev.failed && prev.hash === incoming.hash);
  return {
    value: same && !replaceIfSameHash ? prev!.value : incoming.value,
    hash: incoming.hash,
    fetchedAt: now,
    lastAttempt: now,
    failed: false,
  };
}

export function isLastGoodFresh(
  entry: LastGoodEntry<unknown> | null | undefined,
  now: number,
  ttlMs: number
): boolean {
  return Boolean(entry && !entry.failed && now - entry.fetchedAt < ttlMs);
}
