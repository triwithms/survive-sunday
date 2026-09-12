import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureWeekLockedEffects, isWeekLocked } from "@/lib/grading";
import { formatKickoff } from "@/lib/utils";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ScoresSearchParams = {
  week?: string | string[];
};

export default async function ScoresPage({
  searchParams,
}: {
  searchParams?: Promise<ScoresSearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const params = await searchParams;
  const rawWeek = params?.week;
  const requestedWeek = Array.isArray(rawWeek) ? rawWeek[0] : rawWeek;
  const parsedWeek = requestedWeek ? Number(requestedWeek) : NaN;
  const weeks = await prisma.week.findMany({
    where: { poolId: me.poolId },
    orderBy: { number: "asc" },
    include: { games: { select: { id: true } } },
  });
  const requestedIsValid =
    Number.isInteger(parsedWeek) && weeks.some((week) => week.number === parsedWeek);
  const selectedNumber = requestedIsValid ? parsedWeek : me.pool.currentWeek;
  const selectedRef =
    weeks.find((week) => week.number === selectedNumber) ??
    weeks.find((week) => week.number === me.pool.currentWeek) ??
    weeks[0];

  if (!selectedRef) {
    return (
      <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
        No weeks have been seeded for this pool yet.
      </div>
    );
  }

  // Auto-grade finals + missed picks when lock has passed (idempotent).
  try {
    await ensureWeekLockedEffects(selectedRef.id);
  } catch (e) {
    console.error("scores lock effects skipped", e);
  }

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });
  const locked = isWeekLocked(week);
  const revealAllPicks = locked || week.number < me.pool.currentWeek;
  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    orderBy: { nickname: "asc" },
    include: {
      picks: { where: { weekId: week.id } },
    },
  });
  const participants = members.filter((member) => member.role !== "admin");

  const weekOptions = weeks.map((candidate) => ({
    number: candidate.number,
    label: candidate.label,
    hasGames: candidate.games.length > 0,
  }));

  return (
    <div className="space-y-4 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          {week.label} scores
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Live / simulated scores. Finals auto-grade picks.
        </p>
      </div>

      <WeekSwitcher
        weeks={weekOptions}
        selectedWeek={week.number}
        currentWeek={me.pool.currentWeek}
        basePath="/scores"
      />

      {week.games.length === 0 ? (
        <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
          Games for {week.label} have not been seeded yet. Check back when the
          slate is available.
        </div>
      ) : (
        <ul className="space-y-2">
          {week.games.map((g) => (
            <li key={g.id} className="card-glass p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono">
                  <span className={g.status === "final" && (g.scoreAway ?? 0) > (g.scoreHome ?? 0) ? "text-field-400 font-semibold" : ""}>
                    {g.awayAbbr}
                  </span>{" "}
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
                  )}{" "}
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
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="font-display text-xl text-gold-400 tracking-wide">
            Participants&apos; picks
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {revealAllPicks ? "Picks revealed" : "Others reveal after kickoff"}
          </span>
        </div>
        <ul className="space-y-2">
          {participants.map((member) => {
            const rawPick = member.picks[0];
            const isSelf = member.id === me.id;
            const showPick = revealAllPicks || isSelf;
            const pick =
              rawPick && rawPick.source !== "missed" && rawPick.teamAbbr !== "MISS"
                ? rawPick
                : null;
            const result = rawPick?.result ?? "pending";
            return (
              <li key={member.id} className="card-glass p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium min-w-0 truncate">
                    {member.nickname}{isSelf ? " (you)" : ""}
                  </span>
                  {showPick ? (
                    <span className="text-sm text-right shrink-0">
                      {pick ? (
                        <>
                          <span className="font-mono text-gold-400">
                            {pick.teamAbbr}
                          </span>{" "}
                          <span
                            className={
                              result === "win"
                                ? "text-field-400"
                                : result === "loss"
                                  ? "text-crimson-400"
                                  : "text-[var(--text-muted)]"
                            }
                          >
                            · {result}
                          </span>
                        </>
                      ) : (
                        <span className="text-[var(--text-muted)]">
                          No pick{rawPick?.result ? ` · ${result}` : ""}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--text-muted)] italic shrink-0">
                      Reveals after kickoff
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
