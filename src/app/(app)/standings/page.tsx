import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureWeekLockedEffects } from "@/lib/grading";
import { sortParticipants, resolveSeasonWinners } from "@/lib/tiebreak";
import { StatusChip } from "@/components/StatusChip";
import { redirect } from "next/navigation";

export default async function StandingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const week = await prisma.week.findFirst({
    where: { poolId: me.poolId, number: me.pool.currentWeek },
  });
  if (week) await ensureWeekLockedEffects(week.id);

  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
  });
  const sorted = sortParticipants(members);
  const winners = resolveSeasonWinners(members);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Survival board
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Sorted undefeated → one loss → eliminated, then nickname A–Z.
        </p>
      </div>

      <ul className="space-y-2">
        {sorted.map((m, i) => (
          <li key={m.id} className="card-glass p-3 flex items-center gap-3">
            <span className="text-[var(--text-muted)] w-6 text-sm font-mono">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="font-medium">
                {m.nickname}
                {m.id === me.id ? " (you)" : ""}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Losses: {m.losses} · Weeks survived: {m.weeksSurvived}
                {!m.mulliganRemaining && " · Mulligan used"}
              </div>
            </div>
            <StatusChip status={m.status} />
          </li>
        ))}
      </ul>

      <section className="card-glass p-4 text-sm space-y-2">
        <h2 className="font-semibold text-gold-400">Season-end tiebreak</h2>
        <p className="text-[var(--text-muted)]">
          Prefer a sole survivor. If multiple remain alive: fewest losses → most
          weeks survived → nickname A–Z. Shared win if still tied.
        </p>
        {winners.sole && (
          <p>
            Current sole leader:{" "}
            <span className="text-gold-400">{winners.sole.nickname}</span>
          </p>
        )}
        {!winners.sole && winners.shared.length > 0 && (
          <p>
            Shared lead:{" "}
            {winners.shared.map((m) => m.nickname).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
