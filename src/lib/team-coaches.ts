import "server-only";
import fs from "fs";
import path from "path";
import { ESPN_TEAM_IDS, fetchEspnUrlJson, normAbbr } from "@/lib/espn";
import {
  espnCoachProfileUrl,
  formatCoachExperience,
  parseEspnCoach,
  parseEspnCoachRefList,
  wikipediaCoachSearchUrl,
  type EspnCoachDetail,
  type EspnCoachRefList,
  type ParsedCoach,
} from "@/lib/coach-parse";
import { teamExternalNewsUrls } from "@/lib/team-research";

const DATA_DIRS = [
  path.resolve(process.cwd(), "data"),
  path.resolve("/workspace/survive-sunday/app/data"),
  path.resolve("/workspace/survive-sunday/data"),
];

const COACH_SEASON_YEAR = 2026;
const COACH_TTL_MS = 60 * 60 * 1000;
const COACH_FAIL_TTL_MS = 45 * 1000;

type SeedFile = {
  as_of?: string;
  coaches?: Array<{
    abbreviation: string;
    name: string;
    espn_coach_id?: string | null;
    experience?: number | null;
    espn_coach_url?: string | null;
  }>;
};

export type TeamCoachResult = {
  name: string | null;
  experienceLabel: string | null;
  espnCoachUrl: string | null;
  wikipediaUrl: string | null;
  espnTeamUrl: string;
  nflTeamUrl: string;
  source: "espn-live" | "seed" | "none";
  asOf: string | null;
  failed: boolean;
};

let seedCache: { asOf: string | null; byAbbr: Map<string, ParsedCoach> } | null =
  null;

type LiveEntry = {
  fetchedAt: number;
  failed: boolean;
  coach: ParsedCoach | null;
};

const liveByTeam = new Map<string, LiveEntry>();

function loadSeed(): { asOf: string | null; byAbbr: Map<string, ParsedCoach> } {
  if (seedCache) return seedCache;
  const byAbbr = new Map<string, ParsedCoach>();
  let asOf: string | null = null;
  for (const dir of DATA_DIRS) {
    const p = path.join(dir, "team_coaches.json");
    if (!fs.existsSync(p)) continue;
    const file = JSON.parse(fs.readFileSync(p, "utf8")) as SeedFile;
    asOf = file.as_of ?? null;
    for (const row of file.coaches ?? []) {
      const name = (row.name || "").trim();
      const abbr = normAbbr(row.abbreviation || "");
      if (!name || !abbr) continue;
      const espnCoachId = row.espn_coach_id ? String(row.espn_coach_id) : null;
      byAbbr.set(abbr, {
        abbreviation: abbr,
        name,
        espnCoachId,
        experience:
          typeof row.experience === "number" && Number.isFinite(row.experience)
            ? row.experience
            : null,
        espnCoachUrl: espnCoachProfileUrl(espnCoachId, name),
      });
    }
    break;
  }
  seedCache = { asOf, byAbbr };
  return seedCache;
}

async function fetchLiveCoach(abbr: string): Promise<ParsedCoach | null> {
  const key = normAbbr(abbr);
  const teamId = ESPN_TEAM_IDS[key];
  if (!teamId) return null;
  const list = await fetchEspnUrlJson<EspnCoachRefList>(
    `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${COACH_SEASON_YEAR}/teams/${teamId}/coaches`
  );
  const ref = parseEspnCoachRefList(list);
  if (!ref) return null;
  const detail = await fetchEspnUrlJson<EspnCoachDetail>(ref);
  return parseEspnCoach(detail, teamId);
}

async function getLiveCoach(abbr: string): Promise<LiveEntry> {
  const key = normAbbr(abbr);
  const now = Date.now();
  const cached = liveByTeam.get(key);
  const ttl = cached?.failed ? COACH_FAIL_TTL_MS : COACH_TTL_MS;
  if (cached && now - cached.fetchedAt < ttl) return cached;

  try {
    const coach = await fetchLiveCoach(key);
    const entry: LiveEntry = {
      fetchedAt: now,
      failed: !coach,
      coach,
    };
    liveByTeam.set(key, entry);
    return entry;
  } catch {
    if (cached && cached.coach && !cached.failed) return cached;
    const entry: LiveEntry = { fetchedAt: now, failed: true, coach: null };
    liveByTeam.set(key, entry);
    return entry;
  }
}

function toResult(
  abbr: string,
  coach: ParsedCoach | null,
  source: TeamCoachResult["source"],
  asOf: string | null,
  failed: boolean
): TeamCoachResult {
  const urls = teamExternalNewsUrls(abbr);
  return {
    name: coach?.name ?? null,
    experienceLabel: formatCoachExperience(coach?.experience),
    espnCoachUrl: coach?.espnCoachUrl ?? null,
    wikipediaUrl: coach?.name ? wikipediaCoachSearchUrl(coach.name) : null,
    espnTeamUrl: urls.espnTeamUrl,
    nflTeamUrl: urls.nflTeamUrl,
    source,
    asOf,
    failed,
  };
}

/**
 * Head coach for a team page. Prefer a live ESPN core-API read; fall back to
 * data/team_coaches.json. Never invents a name or bio.
 */
export async function getTeamCoach(abbr: string): Promise<TeamCoachResult> {
  const key = normAbbr(abbr);
  const seed = loadSeed();
  const seeded = seed.byAbbr.get(key) ?? null;
  const live = await getLiveCoach(key);
  if (live.coach) {
    return toResult(key, live.coach, "espn-live", seed.asOf, false);
  }
  if (seeded) {
    return toResult(key, seeded, "seed", seed.asOf, live.failed);
  }
  return toResult(key, null, "none", seed.asOf, true);
}
