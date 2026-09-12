/**
 * One-shot repair: finalize all Week 1 games, grade pending picks,
 * recompute weeksSurvived from win picks. Leaves Week 2 lock untouched.
 *
 *   npx tsx scripts/repair-week1-survival.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  simulateRemainingGames,
  gradeWeekPicks,
  recomputeWeeksSurvived,
  ensureWeekLockedEffects,
} from "../src/lib/grading";

const prisma = new PrismaClient();

async function main() {
  const pool = await prisma.pool.findFirst({
    where: { inviteCode: "SUNDAY26" },
  });
  if (!pool) throw new Error("Demo pool SUNDAY26 not found");

  const week1 = await prisma.week.findUniqueOrThrow({
    where: { poolId_number: { poolId: pool.id, number: 1 } },
    include: { games: true },
  });

  const beforeFinal = week1.games.filter((g) => g.status === "final").length;
  console.log(
    `Week 1: ${beforeFinal}/${week1.games.length} final before repair (currentWeek=${pool.currentWeek})`
  );

  const simulated = await simulateRemainingGames(week1.id);
  console.log(`Simulated ${simulated.length} games to final`);

  // Week 1 is already locked historically — ensure missed + grade
  await ensureWeekLockedEffects(week1.id);
  const graded = await gradeWeekPicks(week1.id);
  console.log(`Graded ${graded.length} pending picks`);

  await prisma.week.update({
    where: { id: week1.id },
    data: { status: "graded" },
  });

  const recomputed = await recomputeWeeksSurvived(pool.id);
  console.log(`Recomputed weeksSurvived for ${recomputed.length} members`);

  const members = await prisma.membership.findMany({
    where: { poolId: pool.id, role: "member" },
    include: {
      user: true,
      picks: { include: { week: true } },
    },
    orderBy: { nickname: "asc" },
  });

  for (const m of members) {
    const w1 = m.picks.find((p) => p.week.number === 1);
    console.log(
      `  ${m.nickname}: status=${m.status} losses=${m.losses} weeksSurvived=${m.weeksSurvived} w1=${w1?.teamAbbr ?? "—"}:${w1?.result ?? "—"}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
