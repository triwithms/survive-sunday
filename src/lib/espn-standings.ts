import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { fetchEspnJson, normAbbr } from "@/lib/espn";
import { STANDINGS_TTL_MS } from "@/lib/static-cache-ttl";

/** ESPN → app team abbreviation. */
export function fromEspnAbbr(abbr: string): string {
  return normAbbr(abbr);
}

export type EspnStandingRow = {
  abbr: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
};

type EspnStandingStat = {
  name?: string;
  value?: number | string;
  displayValue?: string;
};

type EspnStandingsPayload = {
  children?: Array<{
    standings?: {
      entries?: Array<{
        team?: { abbreviation?: string };
        stats?: EspnStandingStat[];
      }>;
    };
  }>;
};

function statNum(stats: EspnStandingStat[], name: string): number {
  const s = stats.find((x) => x.name === name);
  if (!s) return 0;
  if (typeof s.value === "number" && Number.isFinite(s.value)) return s.value;
  const raw = s.displayValue ?? s.value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Live NFL W-L / PF-PA from ESPN conference standings (not demo week2-standings.json). */
export async function fetchEspnTeamStandings(): Promise<EspnStandingRow[]> {
  const data = await fetchEspnJson<EspnStandingsPayload>(
    "/apis/v2/sports/football/nfl/standings"
  );
  const out: EspnStandingRow[] = [];
  for (const conf of data.children || []) {
    for (const entry of conf.standings?.entries || []) {
      const raw = entry.team?.abbreviation;
      if (!raw) continue;
      const stats = entry.stats || [];
      out.push({
        abbr: fromEspnAbbr(raw),
        wins: Math.trunc(statNum(stats, "wins")),
        losses: Math.trunc(statNum(stats, "losses")),
        ties: Math.trunc(statNum(stats, "ties")),
        pointsFor: Math.trunc(statNum(stats, "pointsFor")),
        pointsAgainst: Math.trunc(statNum(stats, "pointsAgainst")),
      });
    }
  }
  return out;
}

function winPct(w: number, l: number, t: number): number {
  const g = w + l + t;
  if (g <= 0) return 0;
  return (w + 0.5 * t) / g;
}

/**
 * Overwrite Team W-L/PF/PA from ESPN and recompute divisionRank.
 * Clears seed/demo week2 standings that wrongly show e.g. BUF 0-1 after a win.
 */
export async function syncTeamStandingsFromEspn(): Promise<{
  updated: number;
  teams: number;
  source: "espn";
}> {
  const rows = await fetchEspnTeamStandings();
  const byAbbr = new Map(rows.map((r) => [r.abbr, r] as const));
  const teams = await prisma.team.findMany();
  let updated = 0;

  for (const team of teams) {
    const row = byAbbr.get(team.abbr);
    if (!row) continue;
    const changed =
      team.wins !== row.wins ||
      team.losses !== row.losses ||
      team.ties !== row.ties ||
      team.pointsFor !== row.pointsFor ||
      team.pointsAgainst !== row.pointsAgainst;
    if (!changed) continue;
    await prisma.team.update({
      where: { abbr: team.abbr },
      data: {
        wins: row.wins,
        losses: row.losses,
        ties: row.ties,
        pointsFor: row.pointsFor,
        pointsAgainst: row.pointsAgainst,
      },
    });
    updated += 1;
  }

  // Recompute division ranks from live records (1 = best in division).
  const refreshed = await prisma.team.findMany();
  const groups = new Map<string, typeof refreshed>();
  for (const t of refreshed) {
    const key = `${t.conference}|${t.division}`;
    const list = groups.get(key) || [];
    list.push(t);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const pa = winPct(a.wins, a.losses, a.ties);
      const pb = winPct(b.wins, b.losses, b.ties);
      if (pb !== pa) return pb - pa;
      if (b.wins !== a.wins) return b.wins - a.wins;
      const da = a.pointsFor - a.pointsAgainst;
      const db = b.pointsFor - b.pointsAgainst;
      if (db !== da) return db - da;
      return a.abbr.localeCompare(b.abbr);
    });
    for (let i = 0; i < list.length; i++) {
      const rank = i + 1;
      if (list[i].divisionRank !== rank) {
        await prisma.team.update({
          where: { abbr: list[i].abbr },
          data: { divisionRank: rank },
        });
        updated += 1;
      }
    }
  }

  return { updated, teams: rows.length, source: "espn" };
}

let standingsFreshUntil = 0;
let standingsInflight: Promise<void> | null = null;

/** NFL Standings paints stored W-L first. ESPN refresh does not block the tab. */
export function scheduleTeamStandingsRefresh(): void {
  if (Date.now() < standingsFreshUntil || standingsInflight) return;
  const run = () => {
    if (standingsInflight) return standingsInflight;
    const job = syncTeamStandingsFromEspn()
      .then(() => {
        standingsFreshUntil = Date.now() + STANDINGS_TTL_MS;
      })
      .catch((err) => {
        console.error("deferred standings refresh failed", err);
      })
      .finally(() => {
        if (standingsInflight === job) standingsInflight = null;
      });
    standingsInflight = job;
    return job;
  };
  try {
    after(run);
  } catch (err) {
    console.error("after() unavailable for standings refresh", err);
    void run();
  }
}
