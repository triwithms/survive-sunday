export const NOTIFY_MODES = ["dryrun", "allowlist", "live"] as const;
export type NotifyMode = (typeof NOTIFY_MODES)[number];

function trimEnv(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^['"]+|['"]+$/g, "").trim();
}

/** Preview/local → dryrun. Production → allowlist until an Administrator sets live. */
export function readNotifyMode(
  env: Record<string, string | undefined> = process.env
): NotifyMode {
  const raw = trimEnv(env.NOTIFY_MODE).toLowerCase();
  if (raw === "live" || raw === "allowlist" || raw === "dryrun") return raw;
  if (env.VERCEL_ENV === "preview") return "dryrun";
  if (env.VERCEL_ENV === "production" || env.NODE_ENV === "production") {
    return "allowlist";
  }
  return "dryrun";
}

export function parseNotifyAllowlist(
  raw: string | null | undefined = process.env.NOTIFY_ALLOWLIST
): Set<string> {
  const out = new Set<string>();
  for (const part of (raw ?? "").split(/[,;]+/)) {
    const token = normalizeAllowToken(part);
    if (token) out.add(token);
  }
  return out;
}

export function normalizeAllowToken(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed;
  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits;
}

export function destOnAllowlist(dest: string, list: Set<string>): boolean {
  const token = normalizeAllowToken(dest);
  if (!token || list.size === 0) return false;
  if (list.has(token)) return true;
  const digits = token.replace(/\D/g, "");
  if (digits.length < 10) return false;
  for (const item of list) {
    if (item.replace(/\D/g, "") === digits) return true;
  }
  return false;
}

/** GAME / ADMIN_ALERT only. SECURITY always returns null (send). */
export function modeBlock(
  category: "security" | "game" | "admin_alert",
  dest: string,
  env: Record<string, string | undefined> = process.env
): "dry_run" | null {
  if (category === "security") return null;
  const mode = readNotifyMode(env);
  if (mode === "live") return null;
  if (mode === "dryrun") return "dry_run";
  return destOnAllowlist(dest, parseNotifyAllowlist(env.NOTIFY_ALLOWLIST))
    ? null
    : "dry_run";
}
