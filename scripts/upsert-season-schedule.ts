/**
 * Merge the full 2026 regular-season slate into the live pool.
 * Preserves Week 1 finals/scores and existing picks (remap gameId if needed).
 */
import { PrismaClient } from "@prisma/client";
import {
  gameIdFor,
  loadNormalizedSeason,
  pairKey,
  type NormalizedGame,
} from "../src/lib/season-schedule";

const prisma = new PrismaClient();

async function nextFreeId(week: number, used: Set<string>): Promise<string> {
  for (let i = 1; i <= 99; i++) {
    const id = gameIdFor(week, i);
    if (!used.has(id)) return id;
  }
  throw new Error(`No free game id for week ${week}`);
}

async function upsertWeekGames(
  weekId: string,
  weekNumber: number,
  official: NormalizedGame[],
  replaceUnmatched: boolean
) {
  const existing = await prisma.game.findMany({ where: { weekId } });
  const byPair = new Map(existing.map((g) => [pairKey(g.awayAbbr, g.homeAbbr), g]));
  const usedIds = new Set(existing.map((g) => g.id));
  const officialPairs = new Set(official.map((g) => pairKey(g.awayAbbr, g.homeAbbr)));

  let updated = 0;
  let created = 0;

  for (const g of official) {
    const key = pairKey(g.awayAbbr, g.homeAbbr);
    const row = byPair.get(key);
    if (row) {
      const data: {
        kickoff: Date;
        network: string | null;
        note: string | null;
      } = {
        kickoff: g.kickoff,
        network: g.network ?? row.network,
        note: g.note ?? row.note,
      };
      // Never clobber a final (or live) score line.
      await prisma.game.update({
        where: { id: row.id },
        data:
          row.status === "final" || row.status === "live"
            ? data
            : { ...data, status: "scheduled" },
      });
      updated++;
    } else {
      const id = await nextFreeId(weekNumber, usedIds);
      usedIds.add(id);
      await prisma.game.create({
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
      created++;
    }
  }

  let removed = 0;
  let remapped = 0;
  if (replaceUnmatched) {
    const leftovers = existing.filter(
      (g) => !officialPairs.has(pairKey(g.awayAbbr, g.homeAbbr))
    );
    for (const leftover of leftovers) {
      const picks = await prisma.pick.findMany({
        where: { gameId: leftover.id },
      });
      for (const pk of picks) {
        const replacement = official.find(
          (g) =>
            g.awayAbbr === pk.teamAbbr || g.homeAbbr === pk.teamAbbr
        );
        if (replacement) {
          const dest = await prisma.game.findFirst({
            where: {
              weekId,
              awayAbbr: replacement.awayAbbr,
              homeAbbr: replacement.homeAbbr,
            },
          });
          await prisma.pick.update({
            where: { id: pk.id },
            data: { gameId: dest?.id ?? null },
          });
          remapped++;
        } else {
          await prisma.pick.update({
            where: { id: pk.id },
            data: { gameId: null },
          });
        }
      }
      await prisma.game.delete({ where: { id: leftover.id } });
      removed++;
    }
  }

  return { updated, created, removed, remapped };
}

async function main() {
  const season = loadNormalizedSeason();
  const pool = await prisma.pool.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!pool) throw new Error("No pool in DB");

  console.log(`Merging 2026 schedule into pool ${pool.name} (${pool.id})`);

  const counts: { week: number; games: number; lockAt: string | null }[] = [];

  for (const sw of season) {
    let week = await prisma.week.findUnique({
      where: { poolId_number: { poolId: pool.id, number: sw.week } },
    });
    const lockAt = sw.lockAt;
    if (!week) {
      week = await prisma.week.create({
        data: {
          poolId: pool.id,
          number: sw.week,
          label: `Week ${sw.week}`,
          lockAt: lockAt ?? new Date(),
          status: "open",
        },
      });
      console.log(`  created Week ${sw.week}`);
    } else if (lockAt) {
      await prisma.week.update({
        where: { id: week.id },
        data: { lockAt },
      });
    }

    // Week 1: merge only (keep simulated/real finals). Week 2: replace demo extras.
    const replaceUnmatched = sw.week === 2;
    const result = await upsertWeekGames(
      week.id,
      sw.week,
      sw.games,
      replaceUnmatched
    );

    const n = await prisma.game.count({ where: { weekId: week.id } });
    const lockIso = (lockAt ?? week.lockAt).toISOString();
    counts.push({ week: sw.week, games: n, lockAt: lockIso });
    console.log(
      `  Week ${String(sw.week).padStart(2, " ")}: ${n} games  +${result.created} ~${result.updated} -${result.removed} remap=${result.remapped}  lock ${lockIso}`
    );
  }

  console.log("\nWeek game counts:");
  for (const c of counts) {
    console.log(`  ${c.week}\t${c.games}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
