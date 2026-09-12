import fs from "fs";
import path from "path";

export type SeasonGameIn = {
  away: string;
  home: string;
  kickoff: string;
  network?: string | null;
  note?: string | null;
};

export type SeasonWeekIn = {
  week: number;
  games: SeasonGameIn[];
};

export type SeasonScheduleFile = {
  season: number | string;
  source?: string;
  as_of?: string;
  weeks: SeasonWeekIn[];
};

export type NormalizedGame = {
  awayAbbr: string;
  homeAbbr: string;
  kickoff: Date;
  network: string | null;
  note: string | null;
  timeTbd: boolean;
};

export type NormalizedWeek = {
  week: number;
  games: NormalizedGame[];
  lockAt: Date | null;
};

export const SEASON_DATA_DIRS = [
  path.resolve(process.cwd(), "data"),
  path.resolve(__dirname, "../../data"),
  path.resolve("/workspace/survive-sunday/app/data"),
  path.resolve("/workspace/survive-sunday/data"),
];

const ABBR_ALIASES: Record<string, string> = {
  WSH: "WAS",
  WFT: "WAS",
  JAC: "JAX",
  LA: "LAR",
};

export function normalizeAbbr(abbr: string): string {
  const a = abbr.trim().toUpperCase();
  return ABBR_ALIASES[a] ?? a;
}

/** ESPN Week 18 flex slots often land at Sunday 05:00Z (midnight ET). Use 1pm ET. */
export function resolveKickoff(
  iso: string,
  opts: { week: number; network?: string | null; note?: string | null }
): { kickoff: Date; timeTbd: boolean } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid kickoff ${iso}`);
  }
  const tbd =
    opts.week === 18 &&
    (!opts.network || /tbd/i.test(opts.note ?? "") || /flex game/i.test(opts.note ?? ""));
  if (tbd && d.getUTCHours() === 5 && d.getUTCMinutes() === 0) {
    const sundayAfternoon = new Date(d);
    sundayAfternoon.setUTCHours(18, 0, 0, 0); // 1:00 p.m. ET (EST)
    return { kickoff: sundayAfternoon, timeTbd: true };
  }
  return { kickoff: d, timeTbd: tbd };
}

export function gameIdFor(week: number, index1: number): string {
  return `2026-w${week}-${String(index1).padStart(2, "0")}`;
}

export function pairKey(away: string, home: string): string {
  return `${normalizeAbbr(away)}@${normalizeAbbr(home)}`;
}

export function findSeasonSchedulePath(): string | null {
  const seen = new Set<string>();
  for (const dir of SEASON_DATA_DIRS) {
    const p = path.join(dir, "season-2026-schedule.json");
    if (seen.has(p)) continue;
    seen.add(p);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function loadSeasonScheduleFile(): SeasonScheduleFile {
  const p = findSeasonSchedulePath();
  if (!p) {
    throw new Error(
      `Cannot find season-2026-schedule.json in ${SEASON_DATA_DIRS.join(", ")}`
    );
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as SeasonScheduleFile;
}

export function normalizeSeasonSchedule(
  file: SeasonScheduleFile
): NormalizedWeek[] {
  const byWeek = new Map<number, NormalizedWeek>();
  for (const w of file.weeks) {
    const games: NormalizedGame[] = [];
    for (const g of w.games) {
      const awayAbbr = normalizeAbbr(g.away);
      const homeAbbr = normalizeAbbr(g.home);
      const { kickoff, timeTbd } = resolveKickoff(g.kickoff, {
        week: w.week,
        network: g.network,
        note: g.note,
      });
      games.push({
        awayAbbr,
        homeAbbr,
        kickoff,
        network: g.network ?? null,
        note: g.note ?? null,
        timeTbd,
      });
    }
    games.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    const lockAt =
      games.length > 0
        ? new Date(Math.min(...games.map((g) => g.kickoff.getTime())))
        : null;
    byWeek.set(w.week, { week: w.week, games, lockAt });
  }
  const out: NormalizedWeek[] = [];
  for (let n = 1; n <= 18; n++) {
    out.push(byWeek.get(n) ?? { week: n, games: [], lockAt: null });
  }
  return out;
}

export function loadNormalizedSeason(): NormalizedWeek[] {
  return normalizeSeasonSchedule(loadSeasonScheduleFile());
}
