import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ensureWeekLockedEffects, isWeekLocked } from "@/lib/grading";
import {
  syncWeekScoresFromEspn,
  shouldPollLiveScores,
} from "@/lib/live-scores";
import { formatKickoff } from "@/lib/utils";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import {
  effectiveCurrentWeek,
  isSandboxWeekHidden,
  weeksForParticipants,
} from "@/lib/pool-mode";
import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ScoresSearchParams = {
  week?: string | string[];
};

function statusRank(status: string) {
  if (status === "live") return 0;
  if (status === "scheduled") return 1;
  return 2;
}

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
  const currentWeek = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const weeks = weeksForParticipants(
    me.pool.mode,
    await prisma.week.findMany({
      where: { poolId: me.poolId },
      orderBy: { number: "asc" },
      include: { games: { select: { id: true } } },
    })
  );
  const requestedIsValid =
    Number.isInteger(parsedWeek) &&
    parsedWeek <= currentWeek &&
    !isSandboxWeekHidden(me.pool.mode, parsedWeek) &&
    weeks.some((week) => week.number === parsedWeek);
  const selectedNumber = requestedIsValid ? parsedWeek : currentWeek;
  const selectedRef =
    weeks.find((week) => week.number === selectedNumber) ??
    weeks.find((week) => week.number === currentWeek) ??
    weeks[0];

  if (!selectedRef) {
    return (
      <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
        No weeks have been seeded for this pool yet.
      </div>
    );
  }

  try {
    await ensureWeekLockedEffects(selectedRef.id);
  } catch (e) {
    console.error("scores lock effects skipped", e);
  }

  let espnSyncError: string | null = null;
  try {
    await syncWeekScoresFromEspn(selectedRef.id);
  } catch (e) {
    console.error("espn score sync skipped", e);
    espnSyncError = "Couldn’t refresh ESPN right now — showing last saved scores.";
  }

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });
  const locked = isWeekLocked(week);
  const revealAllPicks = locked || week.number < currentWeek;
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

  const games = [...week.games].sort((a, b) => {
    const rank = statusRank(a.status) - statusRank(b.status);
    if (rank !== 0) return rank;
    return a.kickoff.getTime() - b.kickoff.getTime();
  });
  const liveCount = games.filter((g) => g.status === "live").length;
  const poll = shouldPollLiveScores(games);

  return (
    <div className="space-y-4 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          {week.label} scores
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Live scores from ESPN while games are on. Finals auto-grade picks.
          {liveCount > 0 ? ` · ${liveCount} live now` : ""}
        </p>
        {espnSyncError && (
          <p className="text-xs text-crimson-400 mt-1">{espnSyncError}</p>
        )}
      </div>

      <WeekSwitcher
        weeks={weekOptions}
        selectedWeek={week.number}
        currentWeek={currentWeek}
        basePath="/scores"
      />

      <LiveScoresRefresh weekNumber={week.number} poll={poll} />

      {games.length === 0 ? (
        <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
          Games for {week.label} have not been seeded yet. Check back when the
          games are available.
        </div>
      ) : (
        <ul className="space-y-2">
          {games.map((g) => {
            const isLive = g.status === "live";
            const isFinal = g.status === "final";
            const awayWins =
              isFinal &&
              g.scoreAway != null &&
              g.scoreHome != null &&
              g.scoreAway > g.scoreHome;
            const homeWins =
              isFinal &&
              g.scoreAway != null &&
              g.scoreHome != null &&
              g.scoreHome > g.scoreAway;
            return (
              <li
                key={g.id}
                className={`card-glass p-3 ${
                  isLive ? "border border-field-400/50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono min-w-0">
                    <span
                      className={
                        awayWins || (isLive && (g.scoreAway ?? 0) > (g.scoreHome ?? 0))
                          ? "text-field-400 font-semibold"
                          : ""
                      }
                    >
                      {g.awayAbbr}
                    </span>{" "}
                    {g.scoreAway != null ? (
                      <span className={`text-lg ${isLive ? "text-gold-400" : ""}`}>
                        {g.scoreAway}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">–</span>
                    )}
                    <span className="text-[var(--text-muted)] mx-2">@</span>
                    {g.scoreHome != null ? (
                      <span className={`text-lg ${isLive ? "text-gold-400" : ""}`}>
                        {g.scoreHome}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">–</span>
                    )}{" "}
                    <span
                      className={
                        homeWins || (isLive && (g.scoreHome ?? 0) > (g.scoreAway ?? 0))
                          ? "text-field-400 font-semibold"
                          : ""
                      }
                    >
                      {g.homeAbbr}
                    </span>
                  </div>
                  <span
                    className={`chip shrink-0 ${
                      isFinal
                        ? "chip-gold"
                        : isLive
                          ? "chip-live"
                          : "chip-one-loss"
                    }`}
                  >
                    {isLive ? "LIVE" : g.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {isLive && g.note
                    ? g.note
                    : `${formatKickoff(g.kickoff)}${
                        g.network ? ` · ${g.network}` : ""
                      }`}
                </p>
                {!isLive && g.note && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {g.note}
                  </p>
                )}
              </li>
            );
          })}
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
              rawPick &&
              rawPick.source !== "missed" &&
              rawPick.teamAbbr !== "MISS"
                ? rawPick
                : null;
            const result = rawPick?.result ?? "pending";
            return (
              <li key={member.id} className="card-glass p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium min-w-0 truncate">
                    {member.nickname}
                    {isSelf ? " (you)" : ""}
                    {member.realName ? (
                      <span className="text-xs font-normal text-[var(--text-muted)]">
                        {" "}
                        ({member.realName})
                      </span>
                    ) : null}
                  </span>
                  {showPick ? (
                    <span className="text-sm text-right shrink-0">
                      {pick ? (
                        <>
                          <Link
                            href={`/team/${pick.teamAbbr}`}
                            prefetch={false}
                            className="font-mono text-gold-400 underline underline-offset-2 decoration-gold-400/40"
                          >
                            {pick.teamAbbr}
                          </Link>{" "}
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
