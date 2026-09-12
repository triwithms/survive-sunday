import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { formatKickoff } from "@/lib/utils";
import { resolveFavourite } from "@/lib/matchup-meta";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const weeks = await prisma.week.findMany({
    where: { poolId: me.poolId, number: { gte: me.pool.currentWeek } },
    orderBy: { number: "asc" },
    include: {
      games: { orderBy: { kickoff: "asc" } },
    },
  });

  const current = weeks.find((w) => w.number === me.pool.currentWeek) ?? weeks[0];
  const upcoming = weeks.filter((w) => w.number !== current?.number);

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Schedule
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Plan strong picks — tap a team for research. Weeks without a seeded
          slate show as TBA.
        </p>
      </div>

      {current && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="font-display text-xl text-gold-400 tracking-wide">
              {current.label}
            </h2>
            <span className="chip chip-gold text-[10px]">This week</span>
            <span className="text-xs text-[var(--text-muted)]">
              Lock: {formatKickoff(effectiveLockAt(current))}
              {isWeekLocked(current) ? " · Locked" : " · Open"}
            </span>
          </div>

          {current.games.length === 0 ? (
            <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
              Slate coming — games not seeded yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {current.games.map((g) => {
                const fav = resolveFavourite({
                  homeAbbr: g.homeAbbr,
                  awayAbbr: g.awayAbbr,
                  spreadHome: g.spreadHome,
                  spreadAway: g.spreadAway,
                });
                return (
                  <li key={g.id} className="card-glass p-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <Link
                        href={`/team/${g.awayAbbr}`}
                        prefetch={false}
                        className="font-semibold text-gold-400 hover:underline underline-offset-2"
                      >
                        {g.awayAbbr}
                      </Link>
                      <span className="text-[var(--text-muted)]">@</span>
                      <Link
                        href={`/team/${g.homeAbbr}`}
                        prefetch={false}
                        className="font-semibold text-gold-400 hover:underline underline-offset-2"
                      >
                        {g.homeAbbr}
                      </Link>
                      {g.network && (
                        <span className="chip chip-one-loss text-[10px]">
                          {g.network}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-muted)] flex flex-wrap gap-x-2">
                      <span>{formatKickoff(g.kickoff)}</span>
                      {fav && (
                        <span className="font-mono text-[var(--text-primary)]">
                          {fav.label}
                        </span>
                      )}
                      {g.status === "final" &&
                        g.scoreAway != null &&
                        g.scoreHome != null && (
                          <span>
                            Final {g.scoreAway}–{g.scoreHome}
                          </span>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-gold-400">Upcoming weeks</h2>
          <ul className="space-y-2">
            {upcoming.map((w) => (
              <li key={w.id} className="card-glass p-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{w.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Lock: {formatKickoff(effectiveLockAt(w))}
                    </div>
                  </div>
                  {w.games.length > 0 ? (
                    <span className="chip chip-gold text-[10px]">
                      {w.games.length} games
                    </span>
                  ) : (
                    <span className="chip chip-one-loss text-[10px]">
                      Slate coming · TBA
                    </span>
                  )}
                </div>
                {w.games.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                    {w.games.slice(0, 4).map((g) => (
                      <li key={g.id}>
                        <Link
                          href={`/team/${g.awayAbbr}`}
                          prefetch={false}
                          className="text-gold-400 hover:underline"
                        >
                          {g.awayAbbr}
                        </Link>
                        {" @ "}
                        <Link
                          href={`/team/${g.homeAbbr}`}
                          prefetch={false}
                          className="text-gold-400 hover:underline"
                        >
                          {g.homeAbbr}
                        </Link>
                        {" · "}
                        {formatKickoff(g.kickoff)}
                      </li>
                    ))}
                    {w.games.length > 4 && (
                      <li>+{w.games.length - 4} more</li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
