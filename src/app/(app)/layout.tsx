import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import { ROLE_VIEW_COOKIE, resolveRoleView } from "@/lib/roles";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { HeaderNav } from "@/components/HeaderNav";
import { DemoLockToggle } from "@/components/DemoLockToggle";
import {
  HeaderWeekBadge,
  HeaderWeekNav,
} from "@/components/HeaderWeekNav";
import { prisma } from "@/lib/db";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { gameForPick, playerCanChangeCurrentPick } from "@/lib/pick-change";
import { resolvePlayerPickWeekFromLoaded } from "@/lib/next-week-picks";
import {
  effectiveCurrentWeek,
  isDemoMode,
  weeksForParticipants,
} from "@/lib/pool-mode";
import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { PoolRulesBanner } from "@/components/PoolRulesBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ctx = await getUserPoolContext(session.user.id);
  const membership = ctx.membership;
  if (!membership) redirect("/join");
  const isAdmin = ctx.isAdmin;
  const isPlayer = ctx.isPlayer;
  const cookieStore = await cookies();
  const roleView = resolveRoleView({
    isPlayer,
    isAdmin,
    requested: cookieStore.get(ROLE_VIEW_COOKIE)?.value,
  });
  const showAdminChrome = isAdmin && roleView === "admin";

  const currentWeek = effectiveCurrentWeek(
    membership.pool.mode,
    membership.pool.currentWeek
  );
  const weeks = weeksForParticipants(
    membership.pool.mode,
    await prisma.week.findMany({
      where: { poolId: membership.poolId },
      orderBy: { number: "asc" },
      include: {
      games: {
        select: {
          id: true,
          status: true,
          kickoff: true,
          awayAbbr: true,
          homeAbbr: true,
        },
      },
    },
    })
  );
  const week =
    weeks.find((row) => row.number === currentWeek) ?? weeks[0] ?? null;

  const lockIso = week ? effectiveLockAt(week).toISOString() : null;
  const locked = week ? isWeekLocked(week) : true;
  const weekNav = weeks.map((row) => ({
    number: row.number,
    label: row.label,
    hasGames: row.games.length > 0,
    lockAt: effectiveLockAt(row).toISOString(),
  }));
  const myPick = week
    ? await prisma.pick.findUnique({
        where: {
          membershipId_weekId: {
            membershipId: membership.id,
            weekId: week.id,
          },
        },
      })
    : null;
  const canChangePick = week
    ? playerCanChangeCurrentPick({
        weekNumber: week.number,
        weekLocked: locked,
        eliminated: membership.status === "eliminated",
        isPlayer,
        existingPick: myPick,
        existingGame: gameForPick(myPick, week.games),
      })
    : false;
  const decision = resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: weeks.map((row) => ({
      number: row.number,
      locked: isWeekLocked(row),
      games: row.games,
    })),
    currentPick: myPick,
    playingFromWeek: membership.playingFromWeek,
  });
  const nextWeekRow = weeks.find((row) => row.number === decision.nextWeek);
  const nextOpen =
    decision.nextWeekOpen && nextWeekRow
      ? {
          weekNumber: decision.nextWeek,
          lockAt: effectiveLockAt(nextWeekRow).toISOString(),
        }
      : null;
  const showMakePick =
    !canChangePick &&
    (decision.nextWeekOpen || decision.reason === "slate_not_ready") &&
    isPlayer &&
    membership.status !== "eliminated";
  const showMutedChangePick = !locked && isAdmin && !isPlayer;
  const showDemoLockToggle =
    isDemoMode(membership.pool.mode) && showAdminChrome;

  return (
    <div key={session.user.id} className="min-h-dvh flex flex-col pb-24 overflow-x-hidden max-w-full">
      <header
        data-share-chrome=""
        className="sticky top-0 z-30 border-b border-stadium-border bg-stadium-900/95 backdrop-blur pt-[env(safe-area-inset-top)]"
      >
        <div className="mx-auto max-w-pool w-full px-3 sm:px-4 py-3 flex items-center gap-2 min-w-0">
          <Link
            href="/pool"
            prefetch={false}
            className="font-display text-base sm:text-lg tracking-wide text-gold-400 shrink-0"
          >
            SURVIVE
          </Link>
          <Suspense
            fallback={
              <HeaderWeekBadge
                weekNumber={currentWeek}
                lockAt={lockIso}
                nextOpen={nextOpen}
              />
            }
          >
            <HeaderWeekNav
              weeks={weekNav}
              currentWeek={currentWeek}
              pickActionWeek={decision.actionWeek}
              nextOpen={nextOpen}
            />
          </Suspense>
          <AccountMenu
            nickname={membership.nickname}
            statusLabel={membership.status.replace("_", " ")}
            userId={session.user.id}
            role={membership.role}
            showAdmin={showAdminChrome}
            canSwitchRoles={isPlayer && isAdmin}
            roleView={roleView}
            phoneE164={membership.user.phoneE164}
            phoneSoftPrompt={
              membership.user.phoneE164 == null &&
              membership.user.phoneSkippedAt == null
            }
          />
        </div>
        <HeaderNav
          canChangePick={canChangePick}
          showMutedChangePick={showMutedChangePick}
          showMakePick={showMakePick}
        />
        {showDemoLockToggle && week && (
          <DemoLockToggle locked={locked} weekNumber={week.number} />
        )}
        <PoolRulesBanner
          singleEliminationFromWeek={membership.pool.singleEliminationFromWeek}
          compact
        />
      </header>
      <div className="flex-1 mx-auto w-full max-w-pool px-3 sm:px-4 py-5 min-w-0 overflow-x-hidden">
        {children}
      </div>
      <FooterDisclaimer />
      <BottomNav isAdmin={showAdminChrome} />
    </div>
  );
}
