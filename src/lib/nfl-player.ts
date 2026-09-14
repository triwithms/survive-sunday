/** Client-safe NFL player helpers (no Node fs). */

export type RosterSide = "offence" | "defence" | "special_teams" | "unknown";

export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function namesMatch(a: string, b: string): boolean {
  const left = normalizePlayerName(a);
  const right = normalizePlayerName(b);
  return Boolean(left) && left === right;
}

export function playerSlug(
  name: string,
  number?: number | null,
  extra?: string | null
): string {
  const base = normalizePlayerName(name).replace(/\s+/g, "-");
  const parts = [base || "player"];
  if (number != null && Number.isFinite(number)) parts.push(String(number));
  if (extra) {
    const extraSlug = normalizePlayerName(extra).replace(/\s+/g, "-");
    if (extraSlug) parts.push(extraSlug);
  }
  return parts.join("-");
}

export function roleLabel(role: string): string {
  if (role === "starter") return "Starter";
  if (role === "depth") return "Depth";
  return "Roster";
}

export function sideLabel(side: RosterSide): string {
  if (side === "offence") return "Offence";
  if (side === "defence") return "Defence";
  if (side === "special_teams") return "Special teams";
  return "Roster";
}

export function injuryTone(
  status: string
): "out" | "doubtful" | "questionable" | "other" {
  const s = status.trim().toLowerCase();
  if (
    s === "out" ||
    s === "ir" ||
    s === "injured reserve" ||
    s.includes("out") ||
    s.includes("reserve")
  ) {
    return "out";
  }
  if (s.includes("doubt")) return "doubtful";
  if (s.includes("question")) return "questionable";
  return "other";
}
