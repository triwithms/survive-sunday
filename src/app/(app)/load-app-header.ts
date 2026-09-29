import "server-only";
import { unstable_rethrow } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { resolvePlayerPickWeekFromLoaded } from "@/lib/next-week-picks";
import {
  persistPoolWeekAdvance,
  resolvedPoolWeek,
} from "@/lib/pool-current-week-db";
import { weeksForParticipants } from "@/lib/pool-mode";
import { weeksFromPoolStart } from "@/lib/pool-start-week";
import type { HeaderWeek, NextOpenDeadline } from "@/components/HeaderWeekNav";
import { loadAppMembership, type AppMembership } from "./load-app-membership";
import type { RoleView } from "@/lib/roles";
import { recordServerError } from "@/lib/server-error-log";
import { overlayPoolWeeks } from "@/lib/slate-games";

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

type WeekChrome = Pick<
  AppHeaderData,
  "currentWeek" | "weekNav" | "pickActionWeek" | "lockIso" | "nextOpen"
>;

/** Header and tabs still paint (stored week, no countdown) if week reads fail. */
export function fallbackWeekChrome(me: Pick<AppMembership, "poolCurrentWeek">): WeekChrome {
  return {
    currentWeek: me.poolCurrentWeek,
    weekNav: [],
    pickActionWeek: me.poolCurrentWeek,
    lockIso: null,
    nextOpen: null,
  };
}

/**
 * The layout wraps every tab and sits above (app)/error.tsx, so a throw
 * here reaches the root error page with no header or tabs. Only the
 * membership load (auth + redirects) may fail the shell.
 */
export async function loadAppHeader(): Promise<AppHeaderData> {
  const me = await loadAppMembership();
  let chrome: WeekChrome;
  try {
    chrome = await loadWeekChrome(me);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[layout] week chrome skipped", error);
    const message = error instanceof Error ? error.message : String(error);
    const record = () =>
      recordServerError({ route: "layout week chrome", message, source: "layout" });
    try {
      after(record);
    } catch {
      void record();
    }
    chrome = fallbackWeekChrome(me);
  }
  return { ...chromeFromMembership(me), ...chrome };
}

async function loadWeekChrome(me: AppMembership): Promise<WeekChrome> {
  const weeks = weeksForParticipants(
    me.poolMode,
    await overlayPoolWeeks(
      me.poolId,
      await prisma.week.findMany({
        where: { poolId: me.poolId },
        orderBy: { number: "asc" },
        include: {
          games: { select: { id: true, status: true, kickoff: true, awayAbbr: true, homeAbbr: true } },
        },
      })
    )
  );
  const { stored, currentWeek } = resolvedPoolWeek(me.poolMode, me.poolCurrentWeek, weeks);
  await persistPoolWeekAdvance(prisma, me.poolId, stored, currentWeek);
  const week = weeks.find((row) => row.number === currentWeek) ?? weeks[0] ?? null;
  const nextWeekPreview = weeks.find((row) => row.number === currentWeek + 1);
  const pickKey = (weekId: string) => ({
    membershipId_weekId: { membershipId: me.membershipId, weekId },
  });
  const [myPick, myNextPick] = await Promise.all([
    week ? prisma.pick.findUnique({ where: pickKey(week.id) }) : null,
    nextWeekPreview ? prisma.pick.findUnique({ where: pickKey(nextWeekPreview.id) }) : null,
  ]);
  const decision = resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: weeks.map((row) => ({
      number: row.number, locked: isWeekLocked(row), games: row.games,
    })),
    currentPick: myPick,
    nextPick: myNextPick,
    playingFromWeek: me.playingFromWeek,
  });
  const nextWeekRow = weeks.find((row) => row.number === decision.nextWeek);

  return {
    currentWeek,
    weekNav: weeksFromPoolStart(weeks, me.poolStartWeek).map((row) => ({
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
