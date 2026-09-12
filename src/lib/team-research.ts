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

export type ProfilePlayer = {
  name: string;
  number: number | null;
  position: string;
  college: string | null;
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

let profilesCache: Map<string, TeamProfile> | null = null;
let injuryCache: { injuries: InjuryRow[]; news: NewsRow[] } | null = null;

export function getTeamProfile(abbr: string): TeamProfile | null {
  if (!profilesCache) {
    const rows = loadJson<TeamProfile[]>("team_profiles.json");
    profilesCache = new Map(
      rows.map((r) => [r.abbreviation === "WSH" ? "WAS" : r.abbreviation, r])
    );
  }
  const key = abbr === "WSH" ? "WAS" : abbr.toUpperCase();
  return profilesCache.get(key) ?? null;
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
  const key = abbr === "WSH" ? "WAS" : abbr.toUpperCase();
  return {
    demo: true,
    injuries: injuryCache.injuries.filter(
      (i) => (i.team === "WSH" ? "WAS" : i.team) === key
    ),
    news: injuryCache.news.filter(
      (n) => !n.team || (n.team === "WSH" ? "WAS" : n.team) === key
    ),
  };
}

const OFFENCE_POS = new Set(
  "QB RB FB WR TE OT OG G C OL T LT RT LG RG".split(" ")
);
const DEFENCE_POS = new Set(
  "DE DT NT DL LB ILB OLB MLB CB S FS SS DB EDGE".split(" ")
);

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
