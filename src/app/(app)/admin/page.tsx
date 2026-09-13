import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPanel } from "@/components/AdminPanel";
import { CommissionerSwitch } from "@/components/CommissionerSwitch";
import { PoolModePanel } from "@/components/PoolModePanel";
import { CommissionerAccountPanel } from "@/components/CommissionerAccountPanel";
import { SignOutButton } from "@/components/SignOutButton";
import {
  effectiveCurrentWeek,
  isDemoEmail,
  isDemoMode,
  normalizePoolMode,
} from "@/lib/pool-mode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const ctx = await getUserPoolContext(session.user.id);
  const me = ctx.membership;
  if (!me) redirect("/join");
  if (!ctx.isAdmin) {
    return (
      <div className="card-glass p-5 space-y-4">
        <div>
          <h1 className="font-display text-2xl text-gold-400 tracking-wide">
            Commissioner only
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            This area is for pool commissioners. Sign in with the commissioner
            account to manage picks and import week results.
          </p>
        </div>
        {isDemoMode(me.pool.mode) && <CommissionerSwitch />}
      </div>
    );
  }

  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    orderBy: { nickname: "asc" },
  });

  const week = await prisma.week.findUniqueOrThrow({
    where: {
      poolId_number: {
        poolId: me.poolId,
        number: effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek),
      },
    },
    include: { games: true },
  });

  const logs = await prisma.auditLog.findMany({
    where: { poolId: me.poolId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Commissioner
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Light admin — your login, pool mode, reset, roster, lock override,
          import picks, simulate scores, remove players. Pick and name edits
          are always audited.
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Mode switch is the first card below. Real mode is Week 1. Week 2 is
          Demo only.
        </p>
      </div>

      <section className="card-glass p-4 space-y-2">
        <p className="text-sm text-[var(--text-primary)] font-medium">
          Signed in as commissioner
        </p>
        <SignOutButton next="/login" className="btn-danger w-full" />
      </section>

      <PoolModePanel
        initialMode={normalizePoolMode(me.pool.mode)}
        isPracticeLogin={isDemoEmail(session.user.email ?? me.user.email)}
      />

      <CommissionerAccountPanel
        currentEmail={session.user.email ?? me.user.email ?? null}
        isPracticeLogin={isDemoEmail(session.user.email ?? me.user.email)}
      />

      <Link
        href="/admin/roster"
        className="btn-primary inline-flex items-center justify-center w-full"
      >
        Roster — nicknames and real names
      </Link>

      <Link
        href="/admin/import"
        className="btn-secondary inline-flex items-center justify-center w-full"
      >
        Import week picks (CSV / paste)
      </Link>

      <AdminPanel
        weekNumber={week.number}
        members={members.map((m) => ({
          id: m.id,
          nickname: m.nickname,
          realName: m.realName,
          status: m.status,
          role: m.role,
        }))}
        games={week.games.map((g) => ({
          id: g.id,
          label: `${g.awayAbbr} @ ${g.homeAbbr}`,
          status: g.status,
        }))}
      />

      <section>
        <h2 className="font-semibold mb-2">Audit log</h2>
        <ul className="space-y-1 text-xs font-mono text-[var(--text-muted)] max-h-64 overflow-y-auto">
          {logs.map((l) => (
            <li key={l.id} className="card-glass p-2">
              <span className="text-gold-400">{l.action}</span>{" "}
              {l.createdAt.toISOString()}
              {l.details && (
                <div className="truncate opacity-80">{l.details}</div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
