import fs from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { DEMO_SANDBOX_WEEK } from "./pool-mode";
import {
  findSeasonSchedulePath,
  gameIdFor,
  loadNormalizedSeason,
  pairKey,
  resolveKickoff,
  SEASON_DATA_DIRS,
  type NormalizedGame,
  type NormalizedWeek,
} from "./season-schedule";

const NAME_TO_ABBR: Record<string, string> = {
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS",
};

type Week2SlateFile = {
  week?: number;
  schedule?: Array<{
    away: string;
    home: string;
    kickoff_et: string;
    network?: string | null;
    venue_note?: string | null;
  }>;
};

export type EnsureWeek2SlateResult = {
  changed: boolean;
  createdWeek: boolean;
  createdGames: number;
  updatedGames: number;
  removedGames: number;
  gameCount: number;
  lockAt: string | null;
};

function findWeek2SlatePath(): string | null {
  const seen = new Set<string>();
  for (const dir of SEASON_DATA_DIRS) {
    const p = path.join(dir, "week2-slate.json");
    if (seen.has(p)) continue;
    seen.add(p);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function fromWeek2SlateFile(): NormalizedWeek | null {
  const p = findWeek2SlatePath();
  if (!p) return null;
  const file = JSON.parse(fs.readFileSync(p, "utf8")) as Week2SlateFile;
  const games: NormalizedGame[] = [];
  for (const g of file.schedule ?? []) {
    const awayAbbr = NAME_TO_ABBR[g.away] ?? g.away.trim().toUpperCase();
    const homeAbbr = NAME_TO_ABBR[g.home] ?? g.home.trim().toUpperCase();
    if (!awayAbbr || !homeAbbr) continue;
    const { kickoff, timeTbd } = resolveKickoff(g.kickoff_et, {
      week: DEMO_SANDBOX_WEEK,
      network: g.network,
      note: g.venue_note,
    });
    games.push({
      awayAbbr,
      homeAbbr,
      kickoff,
      network: g.network ?? null,
      note: g.venue_note ?? null,
      timeTbd,
    });
  }
  games.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  if (games.length === 0) return null;
  return {
    week: DEMO_SANDBOX_WEEK,
    games,
    lockAt: new Date(Math.min(...games.map((g) => g.kickoff.getTime()))),
  };
}

/** Official 2026 Week 2 slate: season JSON first, then week2-slate.json. */
export function loadWeek2Normalized(): NormalizedWeek {
  if (findSeasonSchedulePath()) {
    const official = loadNormalizedSeason().find(
      (w) => w.week === DEMO_SANDBOX_WEEK
    );
    if (official && official.games.length > 0) return official;
  }
  const fallback = fromWeek2SlateFile();
  if (fallback) return fallback;
  throw new Error(
    "No Week 2 slate found (season-2026-schedule.json or week2-slate.json)"
  );
}

async function nextFreeId(week: number, used: Set<string>): Promise<string> {
  for (let i = 1; i <= 99; i++) {
    const id = gameIdFor(week, i);
    if (!used.has(id)) return id;
  }
  throw new Error(`No free game id for week ${week}`);
}

/**
 * Restore Week 2 label, lock, and official games. Never writes picks.
 * Replaces leftover demo matchups so the live slate is the 2026 NFL week.
 */
export async function ensureWeek2Slate(
  db: PrismaClient,
  poolId: string
): Promise<EnsureWeek2SlateResult> {
  const official = loadWeek2Normalized();
  const lockAt = official.lockAt ?? new Date();
  const now = new Date();
  const officialPairs = new Set(
    official.games.map((g) => pairKey(g.awayAbbr, g.homeAbbr))
  );

  let createdWeek = false;
  const existingWeek = await db.week.findUnique({
    where: { poolId_number: { poolId, number: DEMO_SANDBOX_WEEK } },
    include: { games: true },
  });

  if (existingWeek) {
    const existingPairs = new Set(
      existingWeek.games.map((g) => pairKey(g.awayAbbr, g.homeAbbr))
    );
    const samePairs =
      existingPairs.size === officialPairs.size &&
      [...officialPairs].every((key) => existingPairs.has(key));
    const sameLock = existingWeek.lockAt.getTime() === lockAt.getTime();
    const kickoffsMatch =
      samePairs &&
      official.games.every((g) => {
        const row = existingWeek.games.find(
          (existing) =>
            pairKey(existing.awayAbbr, existing.homeAbbr) ===
            pairKey(g.awayAbbr, g.homeAbbr)
        );
        return row && row.kickoff.getTime() === g.kickoff.getTime();
      });
    if (
      existingWeek.label === "Week 2" &&
      sameLock &&
      samePairs &&
      kickoffsMatch
    ) {
      return {
        changed: false,
        createdWeek: false,
        createdGames: 0,
        updatedGames: 0,
        removedGames: 0,
        gameCount: existingWeek.games.length,
        lockAt: lockAt.toISOString(),
      };
    }
  }

  let weekId: string;
  if (!existingWeek) {
    const created = await db.week.create({
      data: {
        poolId,
        number: DEMO_SANDBOX_WEEK,
        label: "Week 2",
        lockAt,
        status: now >= lockAt ? "locked" : "open",
      },
    });
    weekId = created.id;
    createdWeek = true;
  } else {
    await db.week.update({
      where: { id: existingWeek.id },
      data: {
        label: "Week 2",
        lockAt,
        status:
          existingWeek.status === "graded"
            ? existingWeek.status
            : now >= lockAt
              ? "locked"
              : "open",
      },
    });
    weekId = existingWeek.id;
  }

  const existing = await db.game.findMany({ where: { weekId } });
  const byPair = new Map(
    existing.map((g) => [pairKey(g.awayAbbr, g.homeAbbr), g])
  );
  const usedIds = new Set(existing.map((g) => g.id));

  let updatedGames = 0;
  let createdGames = 0;

  for (const g of official.games) {
    const key = pairKey(g.awayAbbr, g.homeAbbr);
    const row = byPair.get(key);
    if (row) {
      await db.game.update({
        where: { id: row.id },
        data:
          row.status === "final" || row.status === "live"
            ? {
                kickoff: g.kickoff,
                network: g.network ?? row.network,
                note: g.note ?? row.note,
              }
            : {
                kickoff: g.kickoff,
                network: g.network ?? row.network,
                note: g.note ?? row.note,
                status: "scheduled",
              },
      });
      updatedGames++;
    } else {
      const id = await nextFreeId(DEMO_SANDBOX_WEEK, usedIds);
      usedIds.add(id);
      await db.game.create({
        data: {
          id,
          weekId,
          awayAbbr: g.awayAbbr,
          homeAbbr: g.homeAbbr,
          kickoff: g.kickoff,
          network: g.network,
          note: g.note,
          status: "scheduled",
        },
      });
      createdGames++;
    }
  }

  let removedGames = 0;
  const leftovers = existing.filter(
    (g) => !officialPairs.has(pairKey(g.awayAbbr, g.homeAbbr))
  );
  for (const leftover of leftovers) {
    await db.pick.updateMany({
      where: { gameId: leftover.id },
      data: { gameId: null },
    });
    await db.game.delete({ where: { id: leftover.id } });
    removedGames++;
  }

  const gameCount = await db.game.count({ where: { weekId } });
  return {
    changed:
      createdWeek || createdGames > 0 || updatedGames > 0 || removedGames > 0,
    createdWeek,
    createdGames,
    updatedGames,
    removedGames,
    gameCount,
    lockAt: lockAt.toISOString(),
  };
}
