import "server-only";
import { prisma } from "@/lib/db";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { resolvePlayerPickWeekFromLoaded } from "@/lib/next-week-picks";
import { effectiveCurrentWeek, weeksForParticipants } from "@/lib/pool-mode";
import type { HeaderWeek, NextOpenDeadline } from "@/components/HeaderWeekNav";
import { loadAppMembership, type AppMembership } from "./load-app-membership";
import type { RoleView } from "@/lib/roles";

export type AppHeaderData = {
  userId: string;
  nickname: string;
  statusLabel: string;
  role: string;
  showAdminChrome: boolean;
  canSwitchRoles: boolean;
  roleView: RoleView;
  phoneE164: string | null;
  phoneSoftPrompt: boolean;
  singleEliminationFromWeek: number | null;
  currentWeek: number;
  weekNav: HeaderWeek[];
  pickActionWeek: number;
  lockIso: string | null;
  nextOpen: NextOpenDeadline | null;
};

function chromeFromMembership(me: AppMembership) {
  return {
    userId: me.userId,
    nickname: me.nickname,
    statusLabel: me.status.replace("_", " "),
    role: me.role,
    showAdminChrome: me.isAdmin && me.roleView === "admin",
    canSwitchRoles: me.isPlayer && me.isAdmin,
    roleView: me.roleView,
    phoneE164: me.phoneE164,
    phoneSoftPrompt: me.phoneE164 == null && me.phoneSkippedAt == null,
    singleEliminationFromWeek: me.singleEliminationFromWeek,
  };
}

export async function loadAppHeader(): Promise<AppHeaderData> {
  const me = await loadAppMembership();
  const currentWeek = effectiveCurrentWeek(me.poolMode, me.poolCurrentWeek);
  const weeks = weeksForParticipants(
    me.poolMode,
    await prisma.week.findMany({
      where: { poolId: me.poolId },
      orderBy: { number: "asc" },
      include: {
        games: {
          select: { id: true, status: true, kickoff: true, awayAbbr: true, homeAbbr: true },
        },
      },
    })
  );
  const week = weeks.find((row) => row.number === currentWeek) ?? weeks[0] ?? null;
  const nextWeekPreview = weeks.find((row) => row.number === currentWeek + 1);
  const pickKey = (weekId: string) => ({
    membershipId_weekId: { membershipId: me.membershipId, weekId },
  });
  const myPick = week
    ? await prisma.pick.findUnique({ where: pickKey(week.id) })
    : null;
  const myNextPick = nextWeekPreview
    ? await prisma.pick.findUnique({ where: pickKey(nextWeekPreview.id) })
    : null;
  const decision = resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: weeks.map((row) => ({
      number: row.number,
      locked: isWeekLocked(row),
      games: row.games,
    })),
    currentPick: myPick,
    nextPick: myNextPick,
    playingFromWeek: me.playingFromWeek,
  });
  const nextWeekRow = weeks.find((row) => row.number === decision.nextWeek);

  return {
    ...chromeFromMembership(me),
    currentWeek,
    weekNav: weeks.map((row) => ({
      number: row.number,
      label: row.label,
      hasGames: row.games.length > 0,
      lockAt: effectiveLockAt(row).toISOString(),
    })),
    pickActionWeek: decision.actionWeek,
    lockIso: week ? effectiveLockAt(week).toISOString() : null,
    nextOpen:
      decision.nextWeekOpen && nextWeekRow
        ? { weekNumber: decision.nextWeek, lockAt: effectiveLockAt(nextWeekRow).toISOString() }
        : null,
  };
}
