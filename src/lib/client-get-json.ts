/** Same-tab JSON GET. One in-flight request per URL, then reuse the body until maxAgeMs. */

export const SCORE_DETAIL_JSON_MAX_AGE_MS = 30_000;
export const VIDEO_JSON_MAX_AGE_MS = 10 * 60 * 1000;

export type DedupedJson = { ok: boolean; status: number; body: unknown };

const cache = new Map<string, { at: number; value: DedupedJson }>();
const inflight = new Map<string, Promise<DedupedJson>>();

/** Browser tabs only. A warm server must not reuse one viewer's JSON for the next. */
function rememberInTab(): boolean {
  return typeof window !== "undefined";
}

export async function fetchJsonDeduped(
  url: string,
  opts: { maxAgeMs: number; fresh?: boolean }
): Promise<DedupedJson> {
  const remember = rememberInTab();
  if (remember && !opts.fresh) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < opts.maxAgeMs) return hit.value;
    const pending = inflight.get(url);
    if (pending) return pending;
  } else if (opts.fresh) {
    cache.delete(url);
  }

  const job = (async () => {
    const res = await fetch(url);
    const body = (await res.json().catch(() => ({}))) as unknown;
    const value: DedupedJson = { ok: res.ok, status: res.status, body };
    if (remember && res.ok) cache.set(url, { at: Date.now(), value });
    return value;
  })();

  if (remember && !opts.fresh) inflight.set(url, job);
  try {
    return await job;
  } finally {
    if (inflight.get(url) === job) inflight.delete(url);
  }
}
