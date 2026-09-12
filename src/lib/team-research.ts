import "server-only";
import fs from "fs";
import path from "path";

/** Server-only JSON loaders for team profiles / sample injury news. Do not import from client components. */

const DATA_DIRS = [
  path.resolve(process.cwd(), "data"),
  path.resolve("/workspace/survive-sunday/app/data"),
  path.resolve("/workspace/survive-sunday/data"),
];

function loadJson<T>(name: string): T {
  for (const dir of DATA_DIRS) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  }
  throw new Error(`Cannot find ${name}`);
}

function tryLoadJson<T>(name: string): T | null {
  for (const dir of DATA_DIRS) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  }
  return null;
}

export type ProfilePlayer = {
  name: string;
  number: number | null;
  position: string;
  college: string | null;
};

export type RosterPlayer = ProfilePlayer & {
  role: "starter" | "depth" | "unknown";
};

export type TeamProfile = {
  abbreviation: string;
  name: string;
  offence_lean: string;
  defence_lean: string;
  run_pass_lean: string;
  lean_basis?: string;
  top_players: ProfilePlayer[];
};

export type InjuryRow = {
  team: string;
  player: string;
  position: string;
  status: string;
  injury: string;
  updated?: string;
  _label?: string;
};

export type NewsRow = {
  team?: string;
  headline: string;
  published?: string;
  _label?: string;
};

export type TeamRosterFile = {
  as_of?: string;
  data_as_of?: string;
  source?: string;
  source_notes?: string;
  roles_note?: string;
  teams: Array<{
    abbreviation: string;
    name: string;
    offence: RosterPlayer[];
    defence: RosterPlayer[];
    special_teams: RosterPlayer[];
  }>;
};

export type FullTeamRoster = {
  abbreviation: string;
  name: string;
  offence: RosterPlayer[];
  defence: RosterPlayer[];
  special_teams: RosterPlayer[];
  asOf: string | null;
  source: string | null;
  sourceNote: string | null;
  /** True when roles are heuristic / unknown rather than depth-chart derived */
  rolesApproximate: boolean;
  fromFullFile: boolean;
};

let profilesCache: Map<string, TeamProfile> | null = null;
let injuryCache: { injuries: InjuryRow[]; news: NewsRow[] } | null = null;
let rostersCache: Map<string, FullTeamRoster> | null = null;
let rosterMeta: {
  asOf: string | null;
  source: string | null;
  sourceNote: string | null;
  rolesApproximate: boolean;
} | null = null;

function normAbbr(abbr: string): string {
  const u = abbr.toUpperCase();
  return u === "WSH" ? "WAS" : u;
}

export function getTeamProfile(abbr: string): TeamProfile | null {
  if (!profilesCache) {
    const rows = loadJson<TeamProfile[]>("team_profiles.json");
    profilesCache = new Map(
      rows.map((r) => [normAbbr(r.abbreviation), r])
    );
  }
  return profilesCache.get(normAbbr(abbr)) ?? null;
}

export function getSampleInjuryNews(abbr: string): {
  injuries: InjuryRow[];
  news: NewsRow[];
  demo: true;
} {
  if (!injuryCache) {
    const raw = loadJson<{
      injuries: InjuryRow[];
      news: NewsRow[];
    }>("sample_injury_news.json");
    injuryCache = { injuries: raw.injuries ?? [], news: raw.news ?? [] };
  }
  const key = normAbbr(abbr);
  return {
    demo: true,
    injuries: injuryCache.injuries.filter((i) => normAbbr(i.team) === key),
    news: injuryCache.news.filter(
      (n) => !n.team || normAbbr(n.team) === key
    ),
  };
}

const OFFENCE_POS = new Set(
  "QB RB FB WR TE OT OG G C OL T LT RT LG RG".split(" ")
);
const DEFENCE_POS = new Set(
  "DE DT NT DL LB ILB OLB MLB CB S FS SS DB EDGE".split(" ")
);
const SPECIAL_POS = new Set("K PK P LS KR PR H KO".split(" "));

export type RosterSides = {
  offence: ProfilePlayer[];
  defence: ProfilePlayer[];
  other: ProfilePlayer[];
};

/** Split seeded top_players into starting offence / defence / other by position. */
export function splitRosterBySide(players: ProfilePlayer[]): RosterSides {
  const offence: ProfilePlayer[] = [];
  const defence: ProfilePlayer[] = [];
  const other: ProfilePlayer[] = [];
  for (const p of players) {
    const pos = (p.position || "").toUpperCase().trim();
    if (OFFENCE_POS.has(pos)) offence.push(p);
    else if (DEFENCE_POS.has(pos)) defence.push(p);
    else other.push(p);
  }
  return { offence, defence, other };
}

function toRosterPlayer(
  p: ProfilePlayer & { role?: string },
  fallbackRole: RosterPlayer["role"] = "unknown"
): RosterPlayer {
  const role =
    p.role === "starter" || p.role === "depth" || p.role === "unknown"
      ? p.role
      : fallbackRole;
  return {
    name: p.name,
    number: p.number ?? null,
    position: p.position,
    college: p.college ?? null,
    role,
  };
}

function loadRostersCache(): void {
  if (rostersCache) return;
  rostersCache = new Map();
  const file = tryLoadJson<TeamRosterFile>("team_rosters.json");
  if (!file?.teams?.length) {
    rosterMeta = {
      asOf: null,
      source: null,
      sourceNote: null,
      rolesApproximate: true,
    };
    return;
  }
  const asOf = file.data_as_of ?? file.as_of ?? null;
  const source = file.source ?? null;
  const sourceNote = file.source_notes ?? file.roles_note ?? null;
  const fromDepthCharts = /depth.?chart/i.test(
    `${source || ""} ${sourceNote || ""}`
  );
  const rolesApproximate = fromDepthCharts
    ? false
    : /approximate|heuristic|no starter/i.test(sourceNote || "") ||
      /espn-site-api/i.test(source || "");

  rosterMeta = {
    asOf,
    source,
    sourceNote,
    rolesApproximate,
  };

  for (const t of file.teams) {
    const abbr = normAbbr(t.abbreviation);
    rostersCache.set(abbr, {
      abbreviation: abbr,
      name: t.name,
      offence: (t.offence || []).map((p) => toRosterPlayer(p)),
      defence: (t.defence || []).map((p) => toRosterPlayer(p)),
      special_teams: (t.special_teams || []).map((p) => toRosterPlayer(p)),
      asOf,
      source,
      sourceNote,
      rolesApproximate: rosterMeta.rolesApproximate,
      fromFullFile: true,
    });
  }
}

/**
 * Full team roster from team_rosters.json when present; otherwise falls back to
 * splitting team_profiles top_players into O/D/other (special_teams empty).
 */
export function getTeamRoster(abbr: string): FullTeamRoster | null {
  loadRostersCache();
  const key = normAbbr(abbr);
  const full = rostersCache!.get(key);
  if (full) return full;

  const profile = getTeamProfile(key);
  if (!profile) return null;
  const sides = splitRosterBySide(profile.top_players ?? []);
  const asRoster = (players: ProfilePlayer[]): RosterPlayer[] =>
    players.map((p) => toRosterPlayer(p, "unknown"));

  const special = sides.other.filter((p) =>
    SPECIAL_POS.has((p.position || "").toUpperCase().trim())
  );
  const otherRest = sides.other.filter(
    (p) => !SPECIAL_POS.has((p.position || "").toUpperCase().trim())
  );

  return {
    abbreviation: key,
    name: profile.name,
    offence: asRoster(sides.offence),
    defence: asRoster(sides.defence),
    special_teams: asRoster([...special, ...otherRest]),
    asOf: null,
    source: "team_profiles.top_players",
    sourceNote:
      "Fallback seed from team profiles — not a full depth chart.",
    rolesApproximate: true,
    fromFullFile: false,
  };
}

export function splitRosterPlayers(players: RosterPlayer[]): {
  starters: RosterPlayer[];
  depth: RosterPlayer[];
} {
  const starters = players.filter((p) => p.role === "starter");
  const depth = players.filter((p) => p.role !== "starter");
  // If no starters marked, treat all as a single list (callers handle)
  return { starters, depth };
}
