import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { Countdown } from "@/components/Countdown";
import { prisma } from "@/lib/db";
import { effectiveLockAt } from "@/lib/grading";
import Link from "next/link";

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

  return (
    <div className="min-h-dvh flex flex-col pb-24">
      <header className="sticky top-0 z-30 border-b border-stadium-border bg-stadium-900/95 backdrop-blur">
        <div className="mx-auto max-w-pool px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/pool" className="font-display text-lg tracking-wide text-gold-400">
            SURVIVE
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="chip chip-gold">
              W{membership.pool.currentWeek}
            </span>
            {lockIso && <Countdown lockAt={lockIso} />}
          </div>
          <div className="flex items-center gap-3">
            {membership.role === "admin" && (
              <Link href="/admin" className="text-xs text-gold-400 underline underline-offset-2">
                Admin
              </Link>
            )}
            <div className="text-right text-xs">
              <div className="text-[var(--text-primary)] font-medium">
              {membership.nickname}
              </div>
              <div className="text-[var(--text-muted)] capitalize">
                {membership.status.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 mx-auto w-full max-w-pool px-4 py-5">{children}</div>
      <FooterDisclaimer />
      <BottomNav isAdmin={membership.role === "admin"} />
    </div>
  );
}
