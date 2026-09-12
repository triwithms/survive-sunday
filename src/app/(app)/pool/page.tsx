import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sortParticipants } from "@/lib/tiebreak";
import { effectiveLockAt, isWeekLocked, ensureWeekLockedEffects, MISSED_TEAM } from "@/lib/grading";
import { StatusChip } from "@/components/StatusChip";
import { formatKickoff } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PoolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const weekRef = await prisma.week.findUniqueOrThrow({
    where: {
      poolId_number: { poolId: me.poolId, number: me.pool.currentWeek },
    },
  });
  await ensureWeekLockedEffects(weekRef.id);

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekRef.id },
    include: { games: true, picks: true },
  });

  // Refresh own membership — missed-pick / grade may have updated status
  const meFresh = await getMembershipForUser(session.user.id);
  const self = meFresh ?? me;

  const locked = isWeekLocked(week);
  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    include: {
      picks: { where: { weekId: week.id }, include: { game: true } },
    },
  });

  const sorted = sortParticipants(members);
  const myPickRaw = members.find((m) => m.id === self.id)?.picks[0];
  const myPick =
    myPickRaw && myPickRaw.source !== "missed" && myPickRaw.teamAbbr !== MISSED_TEAM
      ? myPickRaw
      : undefined;

  const groups = [
    { key: "undefeated", label: "Undefeated" },
    { key: "one_loss", label: "One loss" },
    { key: "eliminated", label: "Eliminated" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-gold-400">
          {week.label}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Lock: {formatKickoff(effectiveLockAt(week))}
          {locked ? " · Picks revealed" : " · Others' picks hidden"}
        </p>
      </div>

      <section className="card-glass p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
          Your pick
        </p>
        {myPick ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xl font-semibold text-gold-400">
                {myPick.teamAbbr}
              </p>
              {myPick.game && (
                <p className="text-sm text-[var(--text-muted)]">
                  {myPick.game.awayAbbr} @ {myPick.game.homeAbbr}
                  {myPick.game.status === "final" &&
                    myPick.game.scoreAway != null &&
                    ` · ${myPick.game.scoreAway}–${myPick.game.scoreHome}`}
                </p>
              )}
              {myPick.source === "imported" && (
                <span className="chip chip-live mt-1">Imported</span>
              )}
            </div>
            <div className="text-right">
              <StatusChip status={self.status} />
              {myPick.result && myPick.result !== "pending" && (
                <p
                  className={`text-sm mt-1 font-medium ${
                    myPick.result === "win"
                      ? "text-field-400"
                      : "text-crimson-400"
                  }`}
                >
                  {myPick.result === "win" ? "Win" : "Loss"}
                </p>
              )}
            </div>
            {!locked && self.status !== "eliminated" && (
              <Link
                href="/pick"
                prefetch={false}
                className="btn-primary text-center text-sm shrink-0 sm:ml-auto"
              >
                Change pick
              </Link>
            )}
          </div>
        ) : self.status === "eliminated" ? (
          <p className="text-[var(--text-muted)]">You&apos;re eliminated — still welcome to hang out.</p>
        ) : self.role === "admin" ? (
          <p className="text-[var(--text-muted)]">
            Commissioner view — you&apos;re not required to pick.
          </p>
        ) : locked ? (
          <p className="text-crimson-400">
            Missed pick — automatic loss at lock.
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[var(--text-muted)]">
              Make your pick before kickoff—don&apos;t leave your mates hanging.
            </p>
            <Link href="/pick" prefetch={false} className="btn-primary text-sm shrink-0">
              Pick now
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Participants</h2>
        <div className="space-y-5">
          {groups.map((g) => {
            const rows = sorted.filter((m) => m.status === g.key);
            if (!rows.length) return null;
            return (
              <div key={g.key}>
                <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  {g.label}
                </h3>
                <ul className="space-y-2">
                  {rows.map((m) => {
                    const pickRaw = m.picks[0];
                    const pick =
                      pickRaw &&
                      pickRaw.source !== "missed" &&
                      pickRaw.teamAbbr !== MISSED_TEAM
                        ? pickRaw
                        : undefined;
                    const isSelf = m.id === self.id;
                    const show = locked || isSelf;
                    const faded = m.status === "eliminated" ? "opacity-60" : "";
                    return (
                      <li
                        key={m.id}
                        className={`card-glass p-3 ${faded}`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {m.nickname}
                              {isSelf ? " (you)" : ""}
                            </span>
                            <StatusChip status={m.status} />
                          </div>
                          {m.realName ? (
                            <div className="text-xs text-[var(--text-muted)]">
                              {m.realName}
                            </div>
                          ) : null}
                          {show && pick ? (
                            <div className="mt-1 text-sm">
                              <span className="font-mono text-gold-400">
                                {pick.teamAbbr}
                              </span>
                              {pick.game && (
                                <span className="text-[var(--text-muted)]">
                                  {" "}
                                  · {pick.game.awayAbbr} @ {pick.game.homeAbbr}
                                </span>
                              )}
                              {pick.result && pick.result !== "pending" && (
                                <span
                                  className={
                                    pick.result === "win"
                                      ? " text-field-400"
                                      : " text-crimson-400"
                                  }
                                >
                                  {" "}
                                  · {pick.result}
                                </span>
                              )}
                              {pick.source === "imported" && (
                                <span className="text-[var(--text-muted)]">
                                  {" "}
                                  · imported
                                </span>
                              )}
                            </div>
                          ) : show ? (
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                              No pick
                            </p>
                          ) : (
                            <p className="text-sm text-[var(--text-muted)] mt-1 italic">
                              Reveals after kickoff
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
