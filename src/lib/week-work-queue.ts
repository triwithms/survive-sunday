import "server-only";

const queues = new Map<string, Promise<void>>();

/** Serialize deferred writes for one week inside a warm server instance. */
export function enqueueWeekWork(
  weekId: string,
  work: () => Promise<void>
): Promise<void> {
  const previous = queues.get(weekId) ?? Promise.resolve();
  const job = previous.catch(() => undefined).then(work);
  queues.set(weekId, job);
  const cleanup = () => {
    if (queues.get(weekId) === job) queues.delete(weekId);
  };
  void job.then(cleanup, cleanup);
  return job;
}
