import "server-only";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import type { KickoffWeek } from "./pool-start-week";

const slateInclude = {
  weeks: {
    orderBy: { number: "asc" as const },
    include: { games: { select: { kickoff: true, status: true } } },
  },
};

/** Shared NFL slate (family pool when it exists). Does not write. */
export async function findSharedSlate() {
  return (
    (await prisma.pool.findUnique({
      where: { inviteCode: INVITE_CODE },
      include: slateInclude,
    })) ??
    (await prisma.pool.findFirst({
      where: { slatePoolId: null, weeks: { some: { games: { some: {} } } } },
      orderBy: { createdAt: "asc" },
      include: slateInclude,
    }))
  );
}

export function slateKickoffWeeks(
  weeks: Array<{ number: number; games: KickoffWeek["games"] }>
): KickoffWeek[] {
  return weeks.map((week) => ({ number: week.number, games: week.games }));
}
