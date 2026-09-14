import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CommissionerSwitch } from "@/components/CommissionerSwitch";
import { RosterEditor } from "@/components/RosterEditor";
import { formatSeatLabel } from "@/lib/claim-seat";
import { isDemoMode } from "@/lib/pool-mode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RosterPage() {
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
            The roster is for the pool commissioner.
          </p>
        </div>
        {isDemoMode(me.pool.mode) && <CommissionerSwitch />}
      </div>
    );
  }

  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    include: { user: { select: { email: true } } },
    orderBy: { nickname: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gold-400">
          ← Commissioner
        </Link>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-2">
          Roster
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Nickname is what the board shows. Real name is the person behind it.
          Fix either if it’s wrong. Set <strong>Pick backup</strong>: off, copy
          from another member (no 💩), or auto 2025-rank team (stamps 💩). Saves
          are audit-logged.
        </p>
      </div>

      <RosterEditor
        members={members.map((m) => ({
          id: m.id,
          nickname: m.nickname,
          realName: m.realName,
          status: m.status,
          role: m.role,
          email: m.user.email,
          mirrorFromMembershipId: m.mirrorFromMembershipId,
          pickBackup: m.pickBackup,
        }))}
        mirrorOptions={members
          .filter((m) => m.role !== "admin")
          .map((m) => ({
            id: m.id,
            nickname: m.nickname,
            label: formatSeatLabel(m.nickname, m.realName),
          }))}
      />
    </div>
  );
}
