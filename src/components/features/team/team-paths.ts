import { normAbbr } from "@/lib/espn-teams";

export const TEAM_SECTIONS = [
  "schedule",
  "offence",
  "defence",
  "special-teams",
  "injuries",
  "news",
] as const;

export type TeamSection = (typeof TEAM_SECTIONS)[number];
export type TeamUnitKey = "offence" | "defence" | "special-teams";

export function teamAbbr(raw: string): string {
  return normAbbr(raw);
}

export function teamHref(abbr: string, section?: TeamSection): string {
  const base = `/team/${teamAbbr(abbr)}`;
  return section ? `${base}/${section}` : base;
}

export function isTeamSection(value: string): value is TeamSection {
  return (TEAM_SECTIONS as readonly string[]).includes(value);
}

export function isTeamUnit(value: string): value is TeamUnitKey {
  return value === "offence" || value === "defence" || value === "special-teams";
}

export function unitTitle(unit: TeamUnitKey): string {
  if (unit === "offence") return "Offence";
  if (unit === "defence") return "Defence";
  return "Special teams";
}
