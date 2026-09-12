import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

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

/** Remap demo picks onto the real 2026 Week 1 slate teams. */
const SLATE_PICKS: Record<string, string | null> = {
  Aurora: "KC", // DEN @ KC (Mon)
  Beacon: "BUF", // BUF @ HOU
  Cedar: "PHI", // WAS @ PHI
  Drift: "DET", // NO @ DET
  Ember: "HOU", // BUF @ HOU
  Frost: "BAL", // BAL @ IND — H2H-ish rivalry energy with Beacon/Ember games
  Grove: "SF", // SF @ LAR (already final — win)
  Harbor: null, // eliminated
  Iris: "GB", // GB @ MIN
  Jasper: null, // late pick risk / no pick
};

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
    },
  });

  const kickoffs = slate.schedule.map((g) => new Date(g.kickoff_et));
  const lockAt = new Date(Math.min(...kickoffs.map((d) => d.getTime())));

  const week1 = await prisma.week.create({
    data: {
      poolId: pool.id,
      number: 1,
      label: "Week 1",
      lockAt,
      status: "locked",
    },
  });

  const kickoffs2 = slate2.schedule.map((g) => new Date(g.kickoff_et));
  const lockAt2 = new Date(Math.min(...kickoffs2.map((d) => d.getTime())));

  const week2 = await prisma.week.create({
    data: {
      poolId: pool.id,
      number: 2,
      label: "Week 2",
      lockAt: lockAt2,
      status: new Date() >= lockAt2 ? "locked" : "open",
    },
  });

  // Placeholder weeks 3–18 from Week 2 lock
  for (let n = 3; n <= 18; n++) {
    const approx = new Date(lockAt2);
    approx.setDate(approx.getDate() + 7 * (n - 2));
    await prisma.week.create({
      data: {
        poolId: pool.id,
        number: n,
        label: `Week ${n}`,
        lockAt: approx,
        status: "open",
      },
    });
  }

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

  const gi1 = await seedGames(week1.id, slate.schedule, "2026-w1", week1Odds.games);
  console.log(`  Week 1: ${gi1} games, lock ${lockAt.toISOString()} (historical)`);
  const gi2 = await seedGames(week2.id, slate2.schedule, "2026-w2", week2Odds.games);
  console.log(`  Week 2: ${gi2} games, lock ${lockAt2.toISOString()} (current)`);

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
    },
  });

  for (const p of demo.participants) {
    const email = `${p.nickname.toLowerCase()}@survivesunday.demo`;
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

  // Sample Week 2 pick (Aurora) so privacy/hidden-picks UX is visible
  const auroraMem = await prisma.membership.findFirst({
    where: { poolId: pool.id, nickname: "Aurora" },
  });
  if (auroraMem) {
    const sampleTeam = "PHI"; // KC @ PHI — different from Aurora W1 KC
    const g2 = await prisma.game.findFirst({
      where: {
        weekId: week2.id,
        OR: [{ awayAbbr: sampleTeam }, { homeAbbr: sampleTeam }],
      },
    });
    if (g2) {
      await prisma.pick.create({
        data: {
          membershipId: auroraMem.id,
          weekId: week2.id,
          teamAbbr: sampleTeam,
          gameId: g2.id,
          source: "user",
          result: "pending",
          submittedAt: new Date(),
        },
      });
      console.log("  Sample Week 2 pick: Aurora → PHI");
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

  // Grade any imported picks whose games are already final
  const pending = await prisma.pick.findMany({
    where: { weekId: week1.id },
    include: { game: true },
  });
  let gradedCount = 0;
  for (const pick of pending) {
    if (!pick.game || pick.game.status !== "final") continue;
    if (pick.game.scoreAway == null || pick.game.scoreHome == null) continue;
    let result: string;
    if (pick.game.scoreAway === pick.game.scoreHome) result = "loss";
    else {
      const winner =
        pick.game.scoreAway > pick.game.scoreHome
          ? pick.game.awayAbbr
          : pick.game.homeAbbr;
      result = pick.teamAbbr === winner ? "win" : "loss";
    }
    await prisma.pick.update({
      where: { id: pick.id },
      data: { result, gradedAt: new Date() },
    });
    const m = await prisma.membership.findUniqueOrThrow({
      where: { id: pick.membershipId },
    });
    if (result === "loss") {
      if (m.mulliganRemaining) {
        await prisma.membership.update({
          where: { id: m.id },
          data: { mulliganRemaining: false, status: "one_loss", losses: m.losses + 1 },
        });
      } else if (m.status !== "eliminated") {
        await prisma.membership.update({
          where: { id: m.id },
          data: { status: "eliminated", losses: m.losses + 1 },
        });
      }
    } else if (result === "win" && m.status !== "eliminated") {
      await prisma.membership.update({
        where: { id: m.id },
        data: { weeksSurvived: m.weeksSurvived + 1 },
      });
    }
    gradedCount++;
  }
  console.log(`  Auto-graded ${gradedCount} picks from final games`);

  // Natural lock may already have passed (demo date) — apply missed picks once
  const { ensureWeekLockedEffects } = await import("../src/lib/grading");
  const lockEffects = await ensureWeekLockedEffects(week1.id);
  console.log(
    `  Lock effects: missed=${lockEffects.missed.length}, graded=${lockEffects.graded.length}`
  );

  await prisma.auditLog.create({
    data: {
      poolId: pool.id,
      actorId: adminUser.id,
      action: "seed",
      details: JSON.stringify({
        note: "Seed: Week 1 historical + Week 2 open (currentWeek=2); W1 picks imported",
        currentWeek: 2,
        week2LockAt: lockAt2.toISOString(),
        missedPicks: lockEffects.missed.length,
      }),
    },
  });

  console.log("✅ Seed complete — pool at Week 2");
  console.log(`   Week 2 lockAt: ${lockAt2.toISOString()}`);
  console.log("   Invite code: SUNDAY26");
  console.log("   Demo password: demo1234");
  console.log("   Demo emails: aurora@survivesunday.demo … jasper@…");
  console.log("   Admin: admin@survivesunday.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
