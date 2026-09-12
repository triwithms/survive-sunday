import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  ensureWeekLockedEffects,
  effectiveLockAt,
  isWeekLocked,
} from "@/lib/grading";
import { sortParticipants, resolveSeasonWinners } from "@/lib/tiebreak";
import { StatusChip } from "@/components/StatusChip";
import { formatKickoff } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  let week = await prisma.week.findFirst({
    where: { poolId: me.poolId, number: me.pool.currentWeek },
  });

  try {
    if (week) await ensureWeekLockedEffects(week.id);
  } catch (e) {
    // Lock effects are best-effort — never blank the standings board
    console.error("standings lock effects skipped", e);
  }

  // Re-fetch week after possible lock effects
  if (week) {
    week = await prisma.week.findUnique({ where: { id: week.id } });
  }

  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
  });
  // Commissioner is a spectator — keep on board but sort after participants
  const sorted = sortParticipants(members);
  const winners = resolveSeasonWinners(members.filter((m) => m.role !== "admin"));

  const locked = week ? isWeekLocked(week) : true;
  const weekLabel = week?.label ?? `Week ${me.pool.currentWeek}`;
  const canChangePick =
    !locked && me.status !== "eliminated" && me.role !== "admin";
  const showMutedChange =
    !locked && (me.role === "admin" || me.status === "eliminated");

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-gold-400 tracking-wide">
            {weekLabel} · Survival board
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {week
              ? `Lock: ${formatKickoff(effectiveLockAt(week))}${
                  locked ? " · Picks locked" : " · Picks still open"
                }`
              : "Current week unavailable"}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Sorted undefeated → one loss → eliminated, then nickname A–Z.
          </p>
        </div>
        {canChangePick ? (
          <Link
            href="/pick"
            prefetch={false}
            className="btn-primary text-center text-sm shrink-0"
          >
            Change pick
          </Link>
        ) : showMutedChange ? (
          <Link
            href="/pick"
            prefetch={false}
            className="btn-secondary text-center text-sm shrink-0 opacity-60"
            title={
              me.role === "admin"
                ? "Commissioner — optional"
                : "Picks unavailable"
            }
          >
            {me.role === "admin" ? "Change pick (optional)" : "Pick"}
          </Link>
        ) : null}
      </div>

      <ul className="space-y-2">
        {sorted.map((m, i) => (
          <li
            key={m.id}
            className="card-glass p-3 flex items-center gap-2 sm:gap-3 min-w-0"
          >
            <span className="text-[var(--text-muted)] w-5 sm:w-6 text-sm font-mono shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-medium truncate">
                {m.nickname}
                {m.id === me.id ? " (you)" : ""}
                {m.role === "admin" ? " · admin" : ""}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate">
                Losses: {m.losses} · Weeks survived: {m.weeksSurvived}
                {!m.mulliganRemaining && " · Mulligan used"}
              </div>
            </div>
            <div className="shrink-0">
              <StatusChip status={m.status} />
            </div>
          </li>
        ))}
      </ul>

      <section className="card-glass p-4 text-sm space-y-2 min-w-0">
        <h2 className="font-semibold text-gold-400">Season-end tiebreak</h2>
        <p className="text-[var(--text-muted)]">
          Prefer a sole survivor. If multiple remain alive: fewest losses → most
          weeks survived → nickname A–Z. Shared win if still tied.
        </p>
        {winners.sole && (
          <p className="break-words">
            Current sole leader:{" "}
            <span className="text-gold-400">{winners.sole.nickname}</span>
          </p>
        )}
        {!winners.sole && winners.shared.length > 0 && (
          <p className="break-words">
            Shared lead:{" "}
            {winners.shared.map((m) => m.nickname).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
