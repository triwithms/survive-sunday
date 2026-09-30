import "server-only";

const queues = new Map<string, Promise<unknown>>();

/** Serialize deferred writes for one week inside a warm server instance. */
export function enqueueWeekWork<T>(
  weekId: string,
  work: () => Promise<T>
): Promise<T> {
  const previous = queues.get(weekId) ?? Promise.resolve();
  const job = previous.catch(() => undefined).then(work);
  queues.set(weekId, job);
  const cleanup = () => {
    if (queues.get(weekId) === job) queues.delete(weekId);
  };
  void job.then(cleanup, cleanup);
  return job;
}
