import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureWeekLockedEffects } from "@/lib/grading";
import { formatKickoff } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function ScoresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const weekRef = await prisma.week.findUniqueOrThrow({
    where: {
      poolId_number: { poolId: me.poolId, number: me.pool.currentWeek },
    },
  });
  // Auto-grade finals + missed picks when lock has passed (idempotent)
  await ensureWeekLockedEffects(weekRef.id);

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-gold-400 tracking-wide">
        {week.label} scores
      </h1>
      <p className="text-sm text-[var(--text-muted)]">
        Live / simulated scores. Finals auto-grade picks.
      </p>
      <ul className="space-y-2">
        {week.games.map((g) => (
          <li key={g.id} className="card-glass p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono">
                <span className={g.status === "final" && (g.scoreAway ?? 0) > (g.scoreHome ?? 0) ? "text-field-400 font-semibold" : ""}>
                  {g.awayAbbr}
                </span>
                {" "}
                {g.scoreAway != null ? (
                  <span className="text-lg">{g.scoreAway}</span>
                ) : (
                  <span className="text-[var(--text-muted)]">–</span>
                )}
                <span className="text-[var(--text-muted)] mx-2">@</span>
                {g.scoreHome != null ? (
                  <span className="text-lg">{g.scoreHome}</span>
                ) : (
                  <span className="text-[var(--text-muted)]">–</span>
                )}
                {" "}
                <span className={g.status === "final" && (g.scoreHome ?? 0) > (g.scoreAway ?? 0) ? "text-field-400 font-semibold" : ""}>
                  {g.homeAbbr}
                </span>
              </div>
              <span
                className={`chip ${
                  g.status === "final"
                    ? "chip-gold"
                    : g.status === "live"
                      ? "chip-live"
                      : "chip-one-loss"
                }`}
              >
                {g.status}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {formatKickoff(g.kickoff)}
              {g.network ? ` · ${g.network}` : ""}
            </p>
            {g.note && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{g.note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
