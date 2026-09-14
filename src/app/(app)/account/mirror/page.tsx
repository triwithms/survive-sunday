import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getMembershipForUser } from "@/lib/session";
import { isPlayerSeat } from "@/lib/roles";
import { formatSeatLabel } from "@/lib/claim-seat";
import { MirrorPicksForm } from "@/components/MirrorPicksForm";
import { resolvePickBackupMode } from "@/lib/pick-mirror";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MirrorPicksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");
  if (!isPlayerSeat(me)) {
    return (
      <div className="card-glass p-5 space-y-3">
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Pick backup
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          The commissioner spectator seat does not pick. Switch to your player
          seat (for example Gams) to set a backup.
        </p>
      </div>
    );
  }

  const others = await prisma.membership.findMany({
    where: { poolId: me.poolId, role: { not: "admin" }, id: { not: me.id } },
    select: { id: true, nickname: true, realName: true },
    orderBy: { nickname: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/help#8-notifications" className="text-gold-400">
            Help
          </Link>
          {" · "}
          Account
        </p>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-1">
          Pick backup
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Optional. Off by default. Copy another member’s pick (JaJa copies
          Gams) if you still have none within 30 minutes, or auto-pick the
          best remaining <strong>2025 rank</strong> team (same list as Pick)
          within about 2 minutes of lock. A pick you already submitted is
          never replaced.
        </p>
      </div>
      <section className="card-glass p-4">
        <MirrorPicksForm
          membershipId={me.id}
          initialMode={resolvePickBackupMode(
            me.pickBackup,
            me.mirrorFromMembershipId
          )}
          initialSourceId={me.mirrorFromMembershipId}
          options={others.map((m) => ({
            id: m.id,
            nickname: m.nickname,
            label: formatSeatLabel(m.nickname, m.realName),
          }))}
        />
      </section>
    </div>
  );
}
