import { INVITE_CODE } from "./constants";
import type { ClaimableSeat } from "./claim-seat";

/** Canonical production origin for administrator share text. */
export const PUBLIC_APP_ORIGIN = "https://survive-sunday.vercel.app";

/** Nickname → URL-safe alias (`Cannoli Stuffer` → `cannoli-stuffer`). */
export function nicknameInviteSlug(nickname: string): string {
  return nickname
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function personalJoinPath(opts: {
  membershipId: string;
  nickname?: string;
  includeWho?: boolean;
}): string {
  const q = new URLSearchParams();
  q.set("seat", opts.membershipId);
  if (opts.includeWho && opts.nickname) {
    const who = nicknameInviteSlug(opts.nickname);
    if (who) q.set("who", who);
  }
  return `/join?${q.toString()}`;
}

export function personalJoinWhoPath(nickname: string): string {
  const who = nicknameInviteSlug(nickname);
  return who ? `/join?who=${encodeURIComponent(who)}` : "/join";
}

export function joinUrl(origin: string, path: string): string {
  const base = (origin || PUBLIC_APP_ORIGIN).replace(/\/$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}

/** Stable per-seat link the administrator copies (membership id). */
export function personalSeatJoinUrl(
  origin: string,
  membershipId: string
): string {
  return joinUrl(origin, personalJoinPath({ membershipId }));
}

/** Nickname-friendly alias. Resolves on Join; seat id still wins if both are present. */
export function personalWhoJoinUrl(origin: string, nickname: string): string {
  return joinUrl(origin, personalJoinWhoPath(nickname));
}

/** True when this nickname slug maps to exactly one roster seat. */
export function nicknameSlugIsUnique(
  nickname: string,
  roster: { nickname: string }[]
): boolean {
  const slug = nicknameInviteSlug(nickname);
  if (!slug) return false;
  return roster.filter((s) => nicknameInviteSlug(s.nickname) === slug).length === 1;
}

/**
 * One URL to copy per seat. Prefer the friendlier `?who=` nickname form when
 * that slug is unique on the roster; otherwise the stable `?seat=` id.
 */
export function personalInviteUrl(
  origin: string,
  seat: { membershipId: string; nickname: string },
  roster: { nickname: string }[]
): string {
  if (nicknameSlugIsUnique(seat.nickname, roster)) {
    return personalWhoJoinUrl(origin, seat.nickname);
  }
  return personalSeatJoinUrl(origin, seat.membershipId);
}

export function resolveSeatFromInvite(
  seats: ClaimableSeat[],
  params: { seat?: string | null; who?: string | null }
): ClaimableSeat | null {
  const seatId = (params.seat ?? "").trim();
  if (seatId) {
    return seats.find((s) => s.membershipId === seatId) ?? null;
  }
  const who = nicknameInviteSlug(params.who ?? "");
  if (!who) return null;
  const matches = seats.filter((s) => nicknameInviteSlug(s.nickname) === who);
  if (matches.length === 1) return matches[0];
  const open = matches.filter((s) => !s.claimed);
  if (open.length === 1) return open[0];
  return matches[0] ?? null;
}

export function arrivedViaPersonalInvite(params: {
  seat?: string | null;
  who?: string | null;
}): boolean {
  return Boolean((params.seat ?? "").trim() || (params.who ?? "").trim());
}

/** Browser origin when available; production URL for server-rendered copy. */
export function shareOrigin(fallback = PUBLIC_APP_ORIGIN): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const env =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL?.trim()
      : "";
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");
  return fallback;
}

export const PERSONAL_INVITE_CODE = INVITE_CODE;
