import "server-only";
import fs from "fs";
import path from "path";
import {
  ESPN_TEAM_IDS,
  espnAbbr,
  fetchEspnJson,
  normAbbr,
} from "@/lib/espn";
import {
  namesMatch,
  playerSlug,
  type RosterSide,
} from "@/lib/nfl-player";

/** Server-only team research: profiles/rosters JSON + live ESPN news (TTL cache). Do not import from client components. */

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

/** Live headline from ESPN / NFL.com (server-fetched). */
export type TeamNewsItem = {
  headline: string;
  url: string;
  published: string | null;
  source: "ESPN" | "NFL.com";
};

export type TeamNewsResult = {
  items: TeamNewsItem[];
  /** True when the upstream fetch failed (show empty-state + external links). */
  failed: boolean;
  fetchedAt: number | null;
  espnTeamUrl: string;
  nflTeamUrl: string;
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

export function getTeamProfile(abbr: string): TeamProfile | null {
  if (!profilesCache) {
    const rows = loadJson<TeamProfile[]>("team_profiles.json");
    profilesCache = new Map(
      rows.map((r) => [normAbbr(r.abbreviation), r])
    );
  }
  return profilesCache.get(normAbbr(abbr)) ?? null;
}

/** Schema-only sample file. Do not show in UI — use getTeamInjuries(). */
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

const NFL_TEAM_SLUGS: Record<string, string> = {
  ARI: "arizona-cardinals",
  ATL: "atlanta-falcons",
  BAL: "baltimore-ravens",
  BUF: "buffalo-bills",
  CAR: "carolina-panthers",
  CHI: "chicago-bears",
  CIN: "cincinnati-bengals",
  CLE: "cleveland-browns",
  DAL: "dallas-cowboys",
  DEN: "denver-broncos",
  DET: "detroit-lions",
  GB: "green-bay-packers",
  HOU: "houston-texans",
  IND: "indianapolis-colts",
  JAX: "jacksonville-jaguars",
  KC: "kansas-city-chiefs",
  LV: "las-vegas-raiders",
  LAC: "los-angeles-chargers",
  LAR: "los-angeles-rams",
  MIA: "miami-dolphins",
  MIN: "minnesota-vikings",
  NE: "new-england-patriots",
  NO: "new-orleans-saints",
  NYG: "new-york-giants",
  NYJ: "new-york-jets",
  PHI: "philadelphia-eagles",
  PIT: "pittsburgh-steelers",
  SF: "san-francisco-49ers",
  SEA: "seattle-seahawks",
  TB: "tampa-bay-buccaneers",
  TEN: "tennessee-titans",
  WAS: "washington-commanders",
};

const NEWS_TTL_MS = 12 * 60 * 1000; // ~12 min success cache
const NEWS_FAIL_TTL_MS = 45 * 1000; // retry sooner after upstream errors

type NewsCacheEntry = {
  fetchedAt: number;
  items: TeamNewsItem[];
  failed: boolean;
};

const newsCacheByTeam = new Map<string, NewsCacheEntry>();

export function teamExternalNewsUrls(abbr: string): {
  espnTeamUrl: string;
  nflTeamUrl: string;
} {
  const key = normAbbr(abbr);
  const espn = espnAbbr(key).toLowerCase();
  const slug = NFL_TEAM_SLUGS[key] ?? key.toLowerCase();
  return {
    espnTeamUrl: `https://www.espn.com/nfl/team/_/name/${espn}`,
    nflTeamUrl: `https://www.nfl.com/teams/${slug}/`,
  };
}

function httpsUrl(href: string | undefined | null): string | null {
  if (!href || typeof href !== "string") return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice(7)}`;
  if (trimmed.startsWith("https://")) return trimmed;
  return null;
}

function sortNewsNewestFirst(items: TeamNewsItem[]): TeamNewsItem[] {
  return [...items].sort((a, b) => {
    const ta = a.published ? Date.parse(a.published) : NaN;
    const tb = b.published ? Date.parse(b.published) : NaN;
    const aOk = Number.isFinite(ta);
    const bOk = Number.isFinite(tb);
    if (aOk && bOk) return tb - ta;
    if (aOk && !bOk) return -1;
    if (!aOk && bOk) return 1;
    return 0;
  });
}

type EspnArticle = {
  headline?: string;
  published?: string;
  lastModified?: string;
  links?: { web?: { href?: string } };
};

async function fetchEspnTeamNewsRaw(abbr: string): Promise<TeamNewsItem[]> {
  const key = normAbbr(abbr);
  const teamId = ESPN_TEAM_IDS[key];
  if (!teamId) return [];

  const data = await fetchEspnJson<{ articles?: EspnArticle[] }>(
    `/apis/site/v2/sports/football/nfl/news?team=${encodeURIComponent(teamId)}&limit=20`
  );
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const seen = new Set<string>();
  const items: TeamNewsItem[] = [];

  for (const a of articles) {
    const headline = (a.headline || "").trim();
    const link = httpsUrl(a.links?.web?.href);
    if (!headline || !link) continue;
    const dedupe = link.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const published =
      (a.published && String(a.published)) ||
      (a.lastModified && String(a.lastModified)) ||
      null;
    items.push({
      headline,
      url: link,
      published,
      source: "ESPN",
    });
  }

  return sortNewsNewestFirst(items);
}

/**
 * Live team headlines from ESPN site API (public). Cached in-memory ~12 min.
 * Never invents headlines — on failure returns empty items + failed:true.
 */
export async function getTeamNews(abbr: string): Promise<TeamNewsResult> {
  const key = normAbbr(abbr);
  const urls = teamExternalNewsUrls(key);
  const cached = newsCacheByTeam.get(key);
  const now = Date.now();
  const ttl = cached?.failed ? NEWS_FAIL_TTL_MS : NEWS_TTL_MS;
  if (cached && now - cached.fetchedAt < ttl) {
    return {
      items: cached.items,
      failed: cached.failed,
      fetchedAt: cached.fetchedAt,
      ...urls,
    };
  }

  try {
    const items = await fetchEspnTeamNewsRaw(key);
    const entry: NewsCacheEntry = {
      fetchedAt: now,
      items,
      failed: false,
    };
    newsCacheByTeam.set(key, entry);
    return {
      items,
      failed: false,
      fetchedAt: now,
      ...urls,
    };
  } catch {
    // Keep prior good cache if present even when TTL expired
    if (cached && cached.items.length > 0 && !cached.failed) {
      return {
        items: cached.items,
        failed: false,
        fetchedAt: cached.fetchedAt,
        ...urls,
      };
    }
    const entry: NewsCacheEntry = {
      fetchedAt: now,
      items: [],
      failed: true,
    };
    newsCacheByTeam.set(key, entry);
    return {
      items: [],
      failed: true,
      fetchedAt: now,
      ...urls,
    };
  }
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

export function splitRosterPlayers<T extends { role: string }>(players: T[]): {
  starters: T[];
  depth: T[];
} {
  const starters = players.filter((p) => p.role === "starter");
  const depth = players.filter((p) => p.role !== "starter");
  // If no starters marked, treat all as a single list (callers handle)
  return { starters, depth };
}

export type PlayerInjuryNote = {
  player: string;
  position: string;
  status: string;
  injury: string;
  updated: string | null;
  comment?: string | null;
  playerUrl?: string | null;
};

export type NflPlayerView = {
  name: string;
  number: number | null;
  position: string;
  college: string | null;
  role: RosterPlayer["role"];
  side: RosterSide;
  slug: string;
  keyPlayer: boolean;
  injury: PlayerInjuryNote | null;
};

const SIDE_ORDER: RosterSide[] = ["offence", "defence", "special_teams"];

function matchNamedInjury<T extends { player: string }>(
  injuries: T[],
  name: string
): T | null {
  return injuries.find((row) => namesMatch(row.player, name)) ?? null;
}

/** Attach ESPN injury rows by player name. Do not use sample_injury_news.json. */
export function withLiveInjuries(
  players: NflPlayerView[],
  injuries: Array<{
    player: string;
    position: string;
    status: string;
    injury: string;
    updated: string | null;
    comment?: string | null;
    playerUrl?: string | null;
  }>
): NflPlayerView[] {
  return players.map((p) => {
    const row = matchNamedInjury(injuries, p.name);
    if (!row) return { ...p, injury: null };
    return {
      ...p,
      injury: {
        player: row.player,
        position: row.position,
        status: row.status,
        injury: row.injury,
        updated: row.updated,
        comment: row.comment,
        playerUrl: row.playerUrl,
      },
    };
  });
}

function isKeyPlayer(profile: TeamProfile | null, name: string): boolean {
  return Boolean(profile?.top_players?.some((p) => namesMatch(p.name, name)));
}

function assignUniqueSlugs(players: Omit<NflPlayerView, "slug">[]): NflPlayerView[] {
  const used = new Set<string>();
  return players.map((p) => {
    let slug = playerSlug(p.name, p.number);
    if (used.has(slug)) slug = playerSlug(p.name, p.number, p.position);
    if (used.has(slug)) slug = playerSlug(p.name, p.number, p.side);
    used.add(slug);
    return { ...p, slug };
  });
}

/** All rostered NFL players for a team, with slugs and key-player flags. */
export function listNflPlayers(abbr: string): NflPlayerView[] {
  const roster = getTeamRoster(abbr);
  if (!roster) return [];
  const profile = getTeamProfile(abbr);

  const rows: Omit<NflPlayerView, "slug">[] = [];
  for (const side of SIDE_ORDER) {
    const group =
      side === "offence"
        ? roster.offence
        : side === "defence"
          ? roster.defence
          : roster.special_teams;
    for (const p of group) {
      rows.push({
        name: p.name,
        number: p.number ?? null,
        position: p.position,
        college: p.college ?? null,
        role: p.role,
        side,
        keyPlayer: isKeyPlayer(profile, p.name),
        injury: null,
      });
    }
  }
  return assignUniqueSlugs(rows);
}

export function findNflPlayer(
  abbr: string,
  slug: string
): NflPlayerView | null {
  const wanted = (slug || "").trim().toLowerCase();
  if (!wanted) return null;
  const players = listNflPlayers(abbr);
  const exact = players.find((p) => p.slug === wanted);
  if (exact) return exact;

  // Name-only slug (no number) when it is unique on the team.
  const byName = players.filter((p) => playerSlug(p.name) === wanted);
  return byName.length === 1 ? byName[0] : null;
}

/** Profile top_players, matched to roster slugs when possible. */
export function listKeyPlayers(abbr: string): NflPlayerView[] {
  const profile = getTeamProfile(abbr);
  const rostered = listNflPlayers(abbr);
  if (!profile?.top_players?.length) {
    return rostered.filter((p) => p.keyPlayer);
  }

  const used = new Set<string>();
  const out: NflPlayerView[] = [];
  for (const p of profile.top_players) {
    const match = rostered.find((r) => namesMatch(r.name, p.name));
    if (match) {
      if (!used.has(match.slug)) {
        used.add(match.slug);
        out.push({ ...match, keyPlayer: true });
      }
      continue;
    }
    const fallbackSlug = playerSlug(p.name, p.number, p.position);
    out.push({
      name: p.name,
      number: p.number ?? null,
      position: p.position,
      college: p.college ?? null,
      role: "unknown",
      side: OFFENCE_POS.has((p.position || "").toUpperCase().trim())
        ? "offence"
        : DEFENCE_POS.has((p.position || "").toUpperCase().trim())
          ? "defence"
          : SPECIAL_POS.has((p.position || "").toUpperCase().trim())
            ? "special_teams"
            : "unknown",
      slug: fallbackSlug,
      keyPlayer: true,
      injury: null,
    });
  }
  return out;
}

export function findKeyOrRosterPlayer(
  abbr: string,
  slug: string
): NflPlayerView | null {
  const fromRoster = findNflPlayer(abbr, slug);
  if (fromRoster) return fromRoster;
  const wanted = (slug || "").trim().toLowerCase();
  if (!wanted) return null;
  return (
    listKeyPlayers(abbr).find(
      (p) => p.slug === wanted || playerSlug(p.name) === wanted
    ) ?? null
  );
}
