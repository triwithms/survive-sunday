import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import {
  findSeasonSchedulePath,
  gameIdFor,
  loadNormalizedSeason,
  pairKey,
  type NormalizedWeek,
} from "../src/lib/season-schedule";
import { backfillPoolAccessRoles } from "../src/lib/roles-db";

const prisma = new PrismaClient();

const DATA = path.resolve(__dirname, "../../data");
// Prefer sibling data via symlink; fall back to absolute package path
const DATA_DIRS = [
  path.resolve(__dirname, "../data"),
  path.resolve("/workspace/survive-sunday/data"),
];

function loadJson<T>(name: string): T {
  for (const dir of DATA_DIRS) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  }
  throw new Error(`Cannot find ${name} in ${DATA_DIRS.join(", ")}`);
}

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

type TeamRow = {
  abbreviation: string;
  name: string;
  city: string;
  nickname: string;
  conference: string;
  division: string;
  primary_color?: string;
  logo_urls?: { espn?: string };
};

type PowerRankingsFile = {
  rankings: { rank: number; team_abbreviation: string }[];
};

type Week2Standing = {
  abbr: string;
  w: number;
  l: number;
  t: number;
  divisionRank: number;
  conference: string;
  division: string;
  pf?: number;
  pa?: number;
};

type OddsGame = {
  away: string;
  home: string;
  spread?: { home: number; away: number };
  moneyline?: { home: number; away: number };
  spreadHome?: number;
  spreadAway?: number;
  mlHome?: number;
  mlAway?: number;
};

type SlateGame = {
  away: string;
  home: string;
  kickoff_et: string;
  network: string;
  status: string;
  score: { away: number; home: number } | null;
  venue_note?: string | null;
};

type DemoPart = {
  id: string;
  nickname: string;
  realName: string;
  status: string;
  mulliganRemaining: boolean;
  usedTeams: string[];
  week1Pick: { team: string } | null;
};

/** Week 1 picks → simulated/real slate winners so all BM Boys grade as wins. */
const SLATE_PICKS: Record<string, string | null> = {
  "Black Cobra": "SEA", // NE @ SEA (final)
  "Cannoli Stuffer": "SF", // SF @ LAR (final)
  Colin: "CAR", // CHI @ CAR
  "Daddy Chill": "TB", // TB @ CIN
  "Deep and Delicious": "IND", // BAL @ IND
  Gams: "DET", // NO @ DET
  Gdogss: "HOU", // BUF @ HOU
  JimmyC: "NYJ", // NYJ @ TEN
  "Long Snapper": "ATL", // ATL @ PIT
  Steve: "KC", // DEN @ KC
  JaJa: "DAL", // DAL @ NYG / CLE @ DAL — owner Week 1, not Gams KC
};

/** Slug nickname → valid demo email local-part (e.g. Deep and Delicious → deep-and-delicious). */
function demoEmailLocal(nickname: string): string {
  return nickname
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🌱 Seeding Survive Sunday…");

  await prisma.auditLog.deleteMany();
  await prisma.pick.deleteMany();
  await prisma.game.deleteMany();
  await prisma.week.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.pool.deleteMany();

  const teams = loadJson<TeamRow[]>("teams.json");
  const power = loadJson<PowerRankingsFile>("power_rankings.json");
  const priorRank = new Map<string, number>();
  for (const r of power.rankings) {
    const ab = r.team_abbreviation === "WSH" ? "WAS" : r.team_abbreviation;
    priorRank.set(ab, r.rank);
  }
  const standingsFile = loadJson<{ teams: Week2Standing[] }>("week2-standings.json");
  const standingBy = new Map(standingsFile.teams.map((s) => [s.abbr, s]));

  for (const t of teams) {
    const abbr = t.abbreviation === "WSH" ? "WAS" : t.abbreviation;
    const st = standingBy.get(abbr);
    await prisma.team.create({
      data: {
        abbr,
        name: t.name,
        city: t.city,
        nickname: t.nickname,
        conference: t.conference,
        division: t.division,
        primaryColor: t.primary_color ?? null,
        logoUrl: t.logo_urls?.espn ?? null,
        priorYearRank: priorRank.get(abbr) ?? null,
        wins: st?.w ?? 0,
        losses: st?.l ?? 0,
        ties: st?.t ?? 0,
        divisionRank: st?.divisionRank ?? null,
        pointsFor: st?.pf ?? 0,
        pointsAgainst: st?.pa ?? 0,
      },
    });
  }
  console.log(`  ${teams.length} teams (prior-year ranks + Week 2 standings)`);

  const slate = loadJson<{
    week: number;
    schedule: SlateGame[];
  }>("week1-slate.json");

  const slate2 = loadJson<{
    week: number;
    schedule: SlateGame[];
  }>("week2-slate.json");

  const week1Odds = loadJson<{ games: OddsGame[] }>("week1-games.json");
  const week2Odds = loadJson<{ games: OddsGame[] }>("week2-odds.json");

  const seasonPath = findSeasonSchedulePath();
  const seasonWeeks: NormalizedWeek[] | null = seasonPath
    ? loadNormalizedSeason()
    : null;
  if (seasonWeeks) {
    console.log(`  Full 2026 schedule: ${seasonPath}`);
  } else {
    console.log("  season-2026-schedule.json missing — Week 1–2 slates only");
  }

  // BM Boys roster lives in demo-participants.json (synced from bm-boys-2026-participants.json)
  const demo = loadJson<{
    participants: DemoPart[];
    poolName: string;
    season: string;
  }>("demo-participants.json");

  // Demo acts as Week 2 in progress — Week 1 is locked historical
  const pool = await prisma.pool.create({
    data: {
      name: demo.poolName || "Survive Sunday — Friends Pool",
      season: demo.season || "2026/27",
      inviteCode: "SUNDAY26",
      currentWeek: 2,
      mode: "demo",
    },
  });

  const kickoffs = slate.schedule.map((g) => new Date(g.kickoff_et));
  const lockAtFallback1 = new Date(Math.min(...kickoffs.map((d) => d.getTime())));
  const kickoffs2 = slate2.schedule.map((g) => new Date(g.kickoff_et));
  const lockAtFallback2 = new Date(
    Math.min(...kickoffs2.map((d) => d.getTime()))
  );

  function lockForWeek(n: number): Date {
    const sw = seasonWeeks?.find((w) => w.week === n);
    if (sw?.lockAt) return sw.lockAt;
    if (n === 1) return lockAtFallback1;
    if (n === 2) return lockAtFallback2;
    const approx = new Date(lockAtFallback2);
    approx.setDate(approx.getDate() + 7 * (n - 2));
    return approx;
  }

  const lockAt = lockForWeek(1);
  const lockAt2 = lockForWeek(2);

  const weekRows: { id: string; number: number }[] = [];
  for (let n = 1; n <= 18; n++) {
    const lock = lockForWeek(n);
    const row = await prisma.week.create({
      data: {
        poolId: pool.id,
        number: n,
        label: `Week ${n}`,
        lockAt: lock,
        status: n === 1 ? "locked" : new Date() >= lock ? "locked" : "open",
      },
    });
    weekRows.push(row);
  }
  const week1 = weekRows[0];
  const week2 = weekRows[1];
  if (!week1 || !week2) throw new Error("Failed to create weeks 1–2");

  function oddsLookup(list: OddsGame[], away: string, home: string) {
    return list.find((o) => o.away === away && o.home === home);
  }

  function resolveOdds(o: OddsGame | undefined) {
    if (!o) {
      return { spreadHome: -3, spreadAway: 3, mlHome: -150, mlAway: 130 };
    }
    const spreadHome = o.spreadHome ?? o.spread?.home ?? -3;
    const spreadAway = o.spreadAway ?? o.spread?.away ?? -spreadHome;
    const mlHome = o.mlHome ?? o.moneyline?.home ?? -150;
    const mlAway = o.mlAway ?? o.moneyline?.away ?? 130;
    return { spreadHome, spreadAway, mlHome, mlAway };
  }

  async function seedGames(
    weekId: string,
    schedule: SlateGame[],
    idPrefix: string,
    oddsList: OddsGame[]
  ) {
    let gi = 0;
    for (const g of schedule) {
      gi++;
      const awayAbbr = NAME_TO_ABBR[g.away];
      const homeAbbr = NAME_TO_ABBR[g.home];
      if (!awayAbbr || !homeAbbr) {
        console.warn("  skip unknown team", g.away, g.home);
        continue;
      }
      const status =
        g.status === "final" ? "final" : g.status === "live" ? "live" : "scheduled";
      const odds = resolveOdds(oddsLookup(oddsList, awayAbbr, homeAbbr));
      await prisma.game.create({
        data: {
          id: `${idPrefix}-${String(gi).padStart(2, "0")}`,
          weekId,
          awayAbbr,
          homeAbbr,
          kickoff: new Date(g.kickoff_et),
          network: g.network,
          status,
          scoreAway: g.score?.away ?? null,
          scoreHome: g.score?.home ?? null,
          note: g.venue_note ?? null,
          spreadHome: odds.spreadHome,
          spreadAway: odds.spreadAway,
          mlHome: odds.mlHome,
          mlAway: odds.mlAway,
        },
      });
    }
    return gi;
  }

  const slateScoreByPair = new Map<
    string,
    { status: string; score: { away: number; home: number } | null; venue_note?: string | null; network: string }
  >();
  for (const g of slate.schedule) {
    const away = NAME_TO_ABBR[g.away];
    const home = NAME_TO_ABBR[g.home];
    if (away && home) {
      slateScoreByPair.set(pairKey(away, home), {
        status: g.status,
        score: g.score,
        venue_note: g.venue_note,
        network: g.network,
      });
    }
  }

  async function seedOfficialWeek(
    weekId: string,
    weekNumber: number,
    oddsList: OddsGame[]
  ) {
    const sw = seasonWeeks?.find((w) => w.week === weekNumber);
    if (!sw || sw.games.length === 0) return 0;
    let gi = 0;
    for (const g of sw.games) {
      gi++;
      const overlay = weekNumber === 1 ? slateScoreByPair.get(pairKey(g.awayAbbr, g.homeAbbr)) : undefined;
      const status =
        overlay?.status === "final"
          ? "final"
          : overlay?.status === "live"
            ? "live"
            : "scheduled";
      const odds = resolveOdds(oddsLookup(oddsList, g.awayAbbr, g.homeAbbr));
      await prisma.game.create({
        data: {
          id: gameIdFor(weekNumber, gi),
          weekId,
          awayAbbr: g.awayAbbr,
          homeAbbr: g.homeAbbr,
          kickoff: g.kickoff,
          network: overlay?.network ?? g.network,
          status,
          scoreAway: overlay?.score?.away ?? null,
          scoreHome: overlay?.score?.home ?? null,
          note: overlay?.venue_note ?? g.note,
          spreadHome: odds.spreadHome,
          spreadAway: odds.spreadAway,
          mlHome: odds.mlHome,
          mlAway: odds.mlAway,
        },
      });
    }
    return gi;
  }

  if (seasonWeeks) {
    for (const row of weekRows) {
      const oddsList = row.number === 1 ? week1Odds.games : week2Odds.games;
      const n = await seedOfficialWeek(row.id, row.number, oddsList);
      if (n > 0) {
        const lock = lockForWeek(row.number);
        console.log(
          `  Week ${row.number}: ${n} games, lock ${lock.toISOString()}${row.number === 1 ? " (historical)" : row.number === 2 ? " (current)" : ""}`
        );
      }
    }
  } else {
    const gi1 = await seedGames(week1.id, slate.schedule, "2026-w1", week1Odds.games);
    console.log(`  Week 1: ${gi1} games, lock ${lockAt.toISOString()} (historical)`);
    const gi2 = await seedGames(week2.id, slate2.schedule, "2026-w2", week2Odds.games);
    console.log(`  Week 2: ${gi2} games, lock ${lockAt2.toISOString()} (current)`);
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Admin user (Robert / commissioner)
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@survivesunday.demo",
      name: "Commissioner",
      passwordHash,
    },
  });
  await prisma.membership.create({
    data: {
      poolId: pool.id,
      userId: adminUser.id,
      nickname: "Commissioner",
      realName: "Robert Gama",
      role: "admin",
      status: "undefeated",
      mulliganRemaining: true,
      isParticipant: false,
    },
  });

  for (const p of demo.participants) {
    const email = `${demoEmailLocal(p.nickname)}@survivesunday.demo`;
    const user = await prisma.user.create({
      data: {
        email,
        name: p.realName,
        passwordHash,
      },
    });

    const losses =
      p.status === "eliminated" ? 2 : p.status === "one_loss" ? 1 : 0;

    const membership = await prisma.membership.create({
      data: {
        poolId: pool.id,
        userId: user.id,
        nickname: p.nickname,
        realName: p.realName,
        role: "member",
        status: p.status,
        mulliganRemaining: p.mulliganRemaining,
        losses,
        weeksSurvived: 0,
        usedTeamsJson: JSON.stringify(p.usedTeams || []),
      },
    });

    const teamAbbr = SLATE_PICKS[p.nickname] ?? null;
    if (teamAbbr) {
      const game = await prisma.game.findFirst({
        where: {
          weekId: week1.id,
          OR: [{ awayAbbr: teamAbbr }, { homeAbbr: teamAbbr }],
        },
      });
      if (game) {
        await prisma.pick.create({
          data: {
            membershipId: membership.id,
            weekId: week1.id,
            teamAbbr,
            gameId: game.id,
            source: "imported",
            result: "pending",
            submittedAt: new Date("2026-09-08T18:00:00.000Z"),
          },
        });
      }
    }
  }

  // Sample Week 2 pick (Gams) so privacy/hidden-picks UX is visible
  const gamsMem = await prisma.membership.findFirst({
    where: { poolId: pool.id, nickname: "Gams" },
  });
  if (gamsMem) {
    const sampleTeam = "PHI"; // KC @ PHI — different from Gams W1 DET
    const g2 = await prisma.game.findFirst({
      where: {
        weekId: week2.id,
        OR: [{ awayAbbr: sampleTeam }, { homeAbbr: sampleTeam }],
      },
    });
    if (g2) {
      await prisma.pick.create({
        data: {
          membershipId: gamsMem.id,
          weekId: week2.id,
          teamAbbr: sampleTeam,
          gameId: g2.id,
          source: "user",
          result: "pending",
          submittedAt: new Date(),
        },
      });
      console.log("  Sample Week 2 pick: Gams → PHI");
    }
  }

  // Rebuild usedTeams from W1 picks + seed extras (DAL etc.)
  const { rebuildUsedTeams } = await import("../src/lib/grading");
  const allMembers = await prisma.membership.findMany({
    where: { poolId: pool.id, role: "member" },
  });
  for (const m of allMembers) {
    await rebuildUsedTeams(m.id);
  }

  // Finalize remaining Week 1 games (demo slate only has a couple finals),
  // grade pending picks, then recompute weeksSurvived from win picks.
  const {
    simulateRemainingGames,
    gradeWeekPicks,
    ensureWeekLockedEffects,
    recomputeWeeksSurvived,
  } = await import("../src/lib/grading");
  const simulated = await simulateRemainingGames(week1.id);
  console.log(`  Simulated ${simulated.length} remaining Week 1 games to final`);

  // Natural lock may already have passed (demo date) — apply missed picks once
  const lockEffects = await ensureWeekLockedEffects(week1.id);
  const gradedExtra = await gradeWeekPicks(week1.id);
  console.log(
    `  Lock effects: missed=${lockEffects.missed.length}, graded=${lockEffects.graded.length + gradedExtra.length}`
  );

  await prisma.week.update({
    where: { id: week1.id },
    data: { status: "graded" },
  });

  await recomputeWeeksSurvived(pool.id);
  console.log("  Recomputed weeksSurvived from win picks");

  await prisma.auditLog.create({
    data: {
      poolId: pool.id,
      actorId: adminUser.id,
      action: "seed",
      details: JSON.stringify({
        note: "Seed: full 2026 schedule weeks 1–18; Week 1 historical + Week 2 current; W1 picks imported",
        currentWeek: 2,
        week2LockAt: lockAt2.toISOString(),
        missedPicks: lockEffects.missed.length,
      }),
    },
  });

  await backfillPoolAccessRoles(prisma, pool.id);

  const { ensureCanonicalLiveSeats } = await import("../src/lib/live-roster");
  const liveSeats = await ensureCanonicalLiveSeats(prisma, pool.id);
  for (const row of liveSeats) {
    if (row.createdMembership || row.mirrorSet || row.importedWeek1) {
      console.log(
        `  Live seat ${row.nickname}: created=${row.createdMembership} week1=${row.importedWeek1} mirror=${row.mirrorSet}`
      );
    }
  }

  console.log("✅ Seed complete — pool at Week 2 (BM Boys)");
  console.log(`   Week 2 lockAt: ${lockAt2.toISOString()}`);
  console.log("   Invite code: SUNDAY26");
  console.log("   Demo password: demo1234");
  console.log("   Default seat: gams@survivesunday.demo (Robert Gama)");
  console.log("   Demo emails: black-cobra@… cannoli-stuffer@… … steve@survivesunday.demo");
  console.log("   Admin: admin@survivesunday.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
