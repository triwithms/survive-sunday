import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { Countdown } from "@/components/Countdown";
import { HeaderNav } from "@/components/HeaderNav";
import { DemoLockToggle } from "@/components/DemoLockToggle";
import { prisma } from "@/lib/db";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { INVITE_CODE } from "@/lib/constants";
import Link from "next/link";

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

  const week = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: membership.poolId,
        number: membership.pool.currentWeek,
      },
    },
  });

  const lockIso = week ? effectiveLockAt(week).toISOString() : null;
  const locked = week ? isWeekLocked(week) : true;
  const canChangePick =
    !locked && membership.status !== "eliminated" && membership.role !== "admin";
  const showMutedChangePick =
    !locked && membership.role === "admin";
  const isDemoPool = membership.pool.inviteCode === INVITE_CODE;

  return (
    <div key={session.user.id} className="min-h-dvh flex flex-col pb-24 overflow-x-hidden max-w-full">
      <header className="sticky top-0 z-30 border-b border-stadium-border bg-stadium-900/95 backdrop-blur">
        <div className="mx-auto max-w-pool w-full px-3 sm:px-4 py-3 flex items-center gap-2 min-w-0">
          <Link
            href="/pool"
            prefetch={false}
            className="font-display text-base sm:text-lg tracking-wide text-gold-400 shrink-0"
          >
            SURVIVE
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2 text-sm min-w-0 flex-1 justify-center overflow-hidden">
            <span className="chip chip-gold shrink-0">
              W{membership.pool.currentWeek}
            </span>
            {lockIso && (
              <span className="min-w-0 overflow-hidden">
                <Countdown lockAt={lockIso} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 max-w-[42%]">
            {membership.role === "admin" && (
              <Link
                href="/admin"
                prefetch={false}
                className="text-xs text-gold-400 underline underline-offset-2 shrink-0"
              >
                Admin
              </Link>
            )}
            <div className="text-right text-xs min-w-0 overflow-hidden">
              <div
                className="text-[var(--text-primary)] font-medium truncate max-w-[7.5rem] sm:max-w-[10rem]"
                title={membership.nickname}
                data-testid="session-nickname"
                data-user-id={session.user.id}
                data-user-role={membership.role}
              >
                {membership.nickname}
              </div>
              <div className="text-[var(--text-muted)] capitalize truncate">
                {membership.status.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>
        <HeaderNav
          canChangePick={canChangePick}
          showMutedChangePick={showMutedChangePick}
        />
        {isDemoPool && week && (
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
