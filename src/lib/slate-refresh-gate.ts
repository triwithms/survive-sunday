/**
 * One ESPN → Game write per slate week per scoreboard fetch. Pools that borrow
 * the slate key their refresh by the owner's Week id, so they share the write
 * instead of each running their own. Pure so verify scripts can drive it.
 */

export type SlateWeekKey = { slateWeekId: string; number: number; year: number };

export type SlateWeekShape = {
  id: string;
  poolId: string;
  ownGameCount: number;
  slatePoolId: string | null;
};

/** The Week whose Game rows this pool week reads. Null means look up the owner's week. */
export function ownSlateWeekId(week: SlateWeekShape): string | null {
  if (!week.slatePoolId || week.slatePoolId === week.poolId) return week.id;
  if (week.ownGameCount > 0) return week.id;
  return null;
}

/** Rows are current when they were written from the scoreboard fetch still fresh in cache. */
export function slateRowsCurrent(
  writtenFrom: number | undefined,
  freshFetchedAt: number | null
): boolean {
  return freshFetchedAt !== null && writtenFrom !== undefined && writtenFrom >= freshFetchedAt;
}

export function createSlateRefresher(
  freshFetchedAt: (weekNumber: number, year: number) => number | null
) {
  const writtenFrom = new Map<string, number>();
  const inflight = new Map<string, Promise<unknown>>();

  const isCurrent = (key: SlateWeekKey) =>
    slateRowsCurrent(writtenFrom.get(key.slateWeekId), freshFetchedAt(key.number, key.year));

  return {
    isCurrent,
    /** True when a page does not need to schedule anything for this slate week. */
    isSettled: (key: SlateWeekKey) => inflight.has(key.slateWeekId) || isCurrent(key),
    /**
     * Null when the rows are already current. Concurrent callers for the same
     * slate week share one write and get the same result.
     */
    run<T extends { scoreboardAt: number | null }>(
      key: SlateWeekKey,
      write: () => Promise<T>
    ): Promise<T | null> {
      const pending = inflight.get(key.slateWeekId);
      if (pending) return pending as Promise<T>;
      if (isCurrent(key)) return Promise.resolve(null);
      const job: Promise<T> = write()
        .then((result) => {
          if (result.scoreboardAt !== null) {
            const prev = writtenFrom.get(key.slateWeekId) ?? 0;
            writtenFrom.set(key.slateWeekId, Math.max(prev, result.scoreboardAt));
          }
          return result;
        })
        .finally(() => {
          if (inflight.get(key.slateWeekId) === job) inflight.delete(key.slateWeekId);
        });
      inflight.set(key.slateWeekId, job);
      return job;
    },
  };
}
