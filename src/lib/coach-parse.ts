import { abbrFromEspnTeamId, normAbbr } from "@/lib/espn-teams";

/** ESPN core API coach object (subset we actually read). */
export type EspnCoachDetail = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  experience?: number | null;
  team?: { $ref?: string };
};

export type EspnCoachRefList = {
  items?: Array<{ $ref?: string }>;
};

export type ParsedCoach = {
  abbreviation: string;
  name: string;
  espnCoachId: string | null;
  experience: number | null;
  espnCoachUrl: string | null;
};

export function teamIdFromRef(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const m = /\/teams\/(\d+)/i.exec(ref);
  return m?.[1] ?? null;
}

export function coachDisplayName(row: EspnCoachDetail): string | null {
  const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
  return name || null;
}

export function espnCoachProfileUrl(id: string | number | null | undefined): string | null {
  if (id == null || id === "") return null;
  return `https://www.espn.com/nfl/coach/_/id/${id}`;
}

export function wikipediaCoachSearchUrl(name: string): string {
  const q = encodeURIComponent(`${name.trim()} NFL head coach`);
  return `https://en.wikipedia.org/wiki/Special:Search?search=${q}`;
}

/** ESPN `experience` is seasons as an NFL head coach — do not invent a bio. */
export function formatCoachExperience(experience: number | null | undefined): string | null {
  if (experience == null || !Number.isFinite(experience) || experience < 0) {
    return null;
  }
  if (experience === 0) {
    return "First season as an NFL head coach (ESPN).";
  }
  if (experience === 1) {
    return "1 season as an NFL head coach (ESPN).";
  }
  return `${experience} seasons as an NFL head coach (ESPN).`;
}

export function parseEspnCoach(
  row: EspnCoachDetail,
  fallbackTeamId?: string | null
): ParsedCoach | null {
  const name = coachDisplayName(row);
  if (!name) return null;
  const teamId = teamIdFromRef(row.team?.$ref) ?? fallbackTeamId ?? null;
  const abbreviation = abbrFromEspnTeamId(teamId);
  if (!abbreviation) return null;
  const espnCoachId = row.id != null && row.id !== "" ? String(row.id) : null;
  const experience =
    typeof row.experience === "number" && Number.isFinite(row.experience)
      ? row.experience
      : null;
  return {
    abbreviation: normAbbr(abbreviation),
    name,
    espnCoachId,
    experience,
    espnCoachUrl: espnCoachProfileUrl(espnCoachId),
  };
}

export function parseEspnCoachRefList(list: EspnCoachRefList): string | null {
  const ref = list.items?.[0]?.$ref;
  return ref && typeof ref === "string" ? ref : null;
}
