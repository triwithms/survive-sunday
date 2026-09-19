import type { NotificationPrefs } from "@/lib/notification-types";

export async function patchNotifyPrefs(opts: {
  url: string;
  prefs: NotificationPrefs;
  extraBody?: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(opts.url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...opts.extraBody, ...opts.prefs }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not save",
    };
  }
  return { ok: true };
}
