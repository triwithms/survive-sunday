import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
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
import {
  effectiveCurrentWeek,
  isDemoMode,
  weeksForParticipants,
} from "@/lib/pool-mode";
import Link from "next/link";
import { NicknameEditor } from "@/components/NicknameEditor";

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

  const membership = await getMembershipForUser(session.user.id);
  if (!membership) redirect("/join");

  const currentWeek = effectiveCurrentWeek(
    membership.pool.mode,
    membership.pool.currentWeek
  );
  const weeks = weeksForParticipants(
    membership.pool.mode,
    await prisma.week.findMany({
      where: { poolId: membership.poolId },
      orderBy: { number: "asc" },
      include: { games: { select: { id: true } } },
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
  const canChangePick =
    !locked && membership.status !== "eliminated" && membership.role !== "admin";
  const showMutedChangePick =
    !locked && membership.role === "admin";
  const showDemoLockToggle =
    isDemoMode(membership.pool.mode) && membership.role === "admin";

  return (
    <div key={session.user.id} className="min-h-dvh flex flex-col pb-24 overflow-x-hidden max-w-full">
      <header className="sticky top-0 z-30 border-b border-stadium-border bg-stadium-900/95 backdrop-blur pt-[env(safe-area-inset-top)]">
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
              <HeaderWeekBadge weekNumber={currentWeek} lockAt={lockIso} />
            }
          >
            <HeaderWeekNav weeks={weekNav} currentWeek={currentWeek} />
          </Suspense>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 max-w-[42%]">
            {membership.role === "admin" && (
              <Link
                href="/admin#pool-mode"
                prefetch={false}
                className="text-xs text-gold-400 underline underline-offset-2 shrink-0"
              >
                Admin
              </Link>
            )}
            <NicknameEditor
              nickname={membership.nickname}
              statusLabel={membership.status.replace("_", " ")}
              userId={session.user.id}
              role={membership.role}
              phoneE164={membership.user.phoneE164}
              phoneSoftPrompt={
                membership.user.phoneE164 == null &&
                membership.user.phoneSkippedAt == null
              }
            />
          </div>
        </div>
        <HeaderNav
          canChangePick={canChangePick}
          showMutedChangePick={showMutedChangePick}
        />
        {showDemoLockToggle && week && (
          <DemoLockToggle locked={locked} weekNumber={week.number} />
        )}
      </header>
      <div className="flex-1 mx-auto w-full max-w-pool px-3 sm:px-4 py-5 min-w-0 overflow-x-hidden">
        {children}
      </div>
      <FooterDisclaimer />
      <BottomNav isAdmin={membership.role === "admin"} />
    </div>
  );
}
