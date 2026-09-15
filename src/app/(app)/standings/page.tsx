import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  ensureWeekLockedEffects,
  effectiveLockAt,
  isWeekLocked,
  MISSED_TEAM,
} from "@/lib/grading";
import {
  sortParticipants,
  resolveSeasonWinners,
  boardPickFields,
  isAlive,
} from "@/lib/tiebreak";
import { AutoPickStamps } from "@/components/AutoPickStamps";
import { StatusChip } from "@/components/StatusChip";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { ShareExport } from "@/components/ShareExport";
import { formatKickoff } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import { gameForPick, playerCanChangeCurrentPick } from "@/lib/pick-change";
import {
  pickHrefForWeek,
  resolvePlayerPickWeek,
} from "@/lib/next-week-picks";
import { teamLogoUrl } from "@/lib/espn-teams";
import { isPoolParticipant, isSingleEliminationWeek } from "@/lib/pool-rules";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  let week = await prisma.week.findFirst({
    where: {
      poolId: me.poolId,
      number: effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek),
    },
    include: { picks: { include: { game: true } }, games: true },
  });

  try {
    if (week) await ensureWeekLockedEffects(week.id);
  } catch (e) {
    // Lock effects are best-effort — never blank the standings board
    console.error("standings lock effects skipped", e);
  }

  // Re-fetch week after possible lock effects
  if (week) {
    week = await prisma.week.findUnique({
      where: { id: week.id },
      include: { picks: { include: { game: true } }, games: true },
    });
  }

  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
  });
  const pickByMember = new Map(
    (week?.picks ?? []).map((p) => [p.membershipId, p])
  );
  const participants = members
    .filter((m) => isPoolParticipant(m))
    .map((m) => ({
      ...m,
      ...boardPickFields(pickByMember.get(m.id), week?.games ?? []),
    }));
  const oneAndDone = isSingleEliminationWeek(
    me.pool.singleEliminationFromWeek,
    effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek)
  );
  const sorted = sortParticipants(participants);
  const winners = resolveSeasonWinners(participants);

  const locked = week ? isWeekLocked(week) : true;
  const weekLabel =
    week?.label ??
    `Week ${effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek)}`;
  const myBoardPick = week ? pickByMember.get(me.id) : undefined;
  const playing = isPoolParticipant(me);
  const canChangePick = week
    ? playerCanChangeCurrentPick({
        weekNumber: week.number,
        weekLocked: locked,
        eliminated: me.status === "eliminated",
        isPlayer: playing,
        existingPick: myBoardPick ?? null,
        existingGame: gameForPick(myBoardPick, week.games),
      })
    : false;
  const nextWeek = await prisma.week.findUnique({
    where: {
      poolId_number: {
        poolId: me.poolId,
        number:
          effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek) + 1,
      },
    },
    include: {
      games: {
        select: {
          id: true,
          status: true,
          kickoff: true,
          awayAbbr: true,
          homeAbbr: true,
        },
      },
    },
  });
  const decision = resolvePlayerPickWeek({
    poolCurrentWeek: effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek),
    currentWeekLocked: locked,
    existingCurrentPick: myBoardPick ?? null,
    existingCurrentGame: gameForPick(myBoardPick, week?.games ?? []),
    playingFromWeek: me.playingFromWeek,
    nextWeekHasGames: (nextWeek?.games.length ?? 0) > 0,
    nextWeekLocked: nextWeek ? isWeekLocked(nextWeek) : false,
  });
  const showMakePick =
    !canChangePick &&
    playing &&
    me.status !== "eliminated" &&
    (decision.nextWeekOpen || decision.reason === "slate_not_ready");
  const showMutedChange =
    !locked && ((me.role === "admin" && !playing) || me.status === "eliminated");
  const revealAllPicks = locked;
  const stillInCount = sorted.filter((m) => isAlive(m.status)).length;
  const undefeatedCount = sorted.filter((m) => m.status === "undefeated").length;
  const eliminatedCount = sorted.filter((m) => m.status === "eliminated").length;

  const teamAbbrs = [
    ...new Set(
      (week?.picks ?? [])
        .filter(
          (p) => p.source !== "missed" && p.teamAbbr !== MISSED_TEAM
        )
        .map((p) => p.teamAbbr)
    ),
  ];
  const teams = teamAbbrs.length
    ? await prisma.team.findMany({ where: { abbr: { in: teamAbbrs } } })
    : [];
  const logoByAbbr = new Map(teams.map((t) => [t.abbr, t.logoUrl]));

  return (
    <div
      id="share-board"
      data-share-root="board"
      data-share-week={weekLabel}
      className="space-y-6 min-w-0"
    >
      <div
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
        data-share-chunk=""
        data-share-section="heading"
      >
        <div className="min-w-0">
          <ShareExport
            surface="board"
            rootId="share-board"
            weekLabel={weekLabel}
            titleRest=" · Survival board"
            stillInCount={stillInCount}
            undefeatedCount={undefeatedCount}
            eliminatedCount={eliminatedCount}
            pickRowCount={sorted.length}
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {week
              ? `Lock: ${formatKickoff(effectiveLockAt(week))}${
                  locked
                    ? canChangePick
                      ? " · Week 1: you can still change until your pick’s kickoff"
                      : " · Picks locked"
                    : " · Picks still open"
                }`
              : "Current week unavailable"}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Sorted by undefeated, then one-loss, then eliminated. Within
            each group: same pick (no pick last), then same game (earlier
            kickoff first), then nickname A–Z.
            {!revealAllPicks
              ? " Others' picks stay hidden until the deadline."
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0" data-share-chrome="">
          {canChangePick ? (
            <Link
              href={pickHrefForWeek(week?.number ?? 1)}
              prefetch={false}
              className="btn-primary text-center text-sm shrink-0"
            >
              Change pick
            </Link>
          ) : showMakePick ? (
            <Link
              href={pickHrefForWeek(decision.nextWeek)}
              prefetch={false}
              className="btn-primary text-center text-sm shrink-0"
            >
              Week {decision.nextWeek} is open — make your pick
            </Link>
          ) : showMutedChange ? (
            <Link
              href="/pick"
              prefetch={false}
              className="btn-secondary text-center text-sm shrink-0 opacity-60"
              title={
                me.role === "admin" && !playing
                  ? "Commissioner — optional"
                  : "Picks unavailable"
              }
            >
              {me.role === "admin" && !playing
                ? "Change pick (optional)"
                : "Pick"}
            </Link>
          ) : null}
        </div>
      </div>

      <ul className="space-y-2">
        {sorted.map((m, i) => {
          const isSelf = m.id === me.id;
          const pickRaw = pickByMember.get(m.id);
          const pick =
            pickRaw &&
            pickRaw.source !== "missed" &&
            pickRaw.teamAbbr !== MISSED_TEAM
              ? pickRaw
              : undefined;
          const showPick = revealAllPicks || isSelf;
          const canEditThisRow =
            isSelf && canChangePick && m.status !== "eliminated";

          return (
            <li
              key={m.id}
              data-share-chunk=""
              data-share-row=""
              data-status={m.status}
              className={`card-glass p-3 flex items-center gap-2 sm:gap-3 min-w-0 ${
                m.status === "eliminated" ? "opacity-60" : ""
              }`}
            >
              <span className="text-[var(--text-muted)] w-5 sm:w-6 text-sm font-mono shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="font-medium truncate">
                  {m.nickname}
                  <AutoPickStamps count={m.autoPickStamps} />
                  {isSelf ? " (you)" : ""}
                  {m.realName ? (
                    <span className="text-xs font-normal text-[var(--text-muted)]">
                      {" "}
                      ({m.realName})
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  Losses: {m.losses} · Weeks survived: {m.weeksSurvived}
                  {!m.mulliganRemaining
                    ? " · Mulligan used"
                    : oneAndDone
                      ? " · One-and-done"
                      : ""}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <StatusChip status={m.status} />
                {showPick && pick ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/team/${pick.teamAbbr}`}
                      prefetch={false}
                      aria-label={`${m.nickname}'s pick: ${pick.teamAbbr}`}
                      className="flex items-center gap-1.5 rounded-md px-1.5 py-1 min-h-11 hover:bg-gold-400/5 active:bg-gold-400/10"
                    >
                      <TeamLogo
                        abbr={pick.teamAbbr}
                        logoUrl={teamLogoUrl(
                          pick.teamAbbr,
                          logoByAbbr.get(pick.teamAbbr)
                        )}
                        size={TEAM_LOGO_SIZE.row}
                      />
                      <span className="font-mono text-base sm:text-lg font-semibold text-gold-400">
                        {pick.teamAbbr}
                      </span>
                      {pick.result ? (
                        <span
                          className={`text-[10px] uppercase font-semibold ${
                            pick.result === "win"
                              ? "text-field-400"
                              : pick.result === "loss"
                                ? "text-crimson-400"
                                : "text-[var(--text-muted)]"
                          }`}
                        >
                          {pick.result}
                        </span>
                      ) : null}
                    </Link>
                    {canEditThisRow ? (
                      <Link
                        href="/pick"
                        prefetch={false}
                        data-share-chrome=""
                        className="btn-primary text-xs px-2.5 py-2 min-h-11"
                      >
                        Change
                      </Link>
                    ) : null}
                  </div>
                ) : showPick ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-crimson-400 font-medium px-1">
                      No pick
                    </span>
                    {canEditThisRow ? (
                      <Link
                        href="/pick"
                        prefetch={false}
                        data-share-chrome=""
                        className="btn-primary text-xs px-2.5 py-2 min-h-11"
                      >
                        Pick
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)] italic px-1">
                    Hidden
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <section
        className="card-glass p-4 text-sm space-y-2 min-w-0"
        data-share-chunk=""
        data-share-section="tiebreak"
      >
        <h2 className="font-semibold text-gold-400">Season-end tiebreak</h2>
        <p className="text-[var(--text-muted)]">
          Official winner must have a <strong>clean</strong> season — no
          ranked auto-pick 💩. Copy-from-member and manual / imported picks
          do not stamp. Auto-pick is for staying in for fun when busy. Among
          eligible players: fewest losses → most weeks survived → shared win
          if still tied.
        </p>
        {winners.sole && (
          <p className="break-words">
            Current official sole leader:{" "}
            <span className="text-gold-400">{winners.sole.nickname}</span>
          </p>
        )}
        {!winners.sole && winners.shared.length > 0 && (
          <p className="break-words">
            Shared official lead:{" "}
            {winners.shared.map((m) => m.nickname).join(", ")}
          </p>
        )}
        {!winners.sole &&
          winners.shared.length === 0 &&
          winners.officialEligible.length === 0 &&
          participants.some((m) => isAlive(m.status)) && (
            <p className="text-[var(--text-muted)]">
              No official leader — remaining players used the ~2-minute
              best-ranked auto-pick (💩).
            </p>
          )}
      </section>
      <p
        data-share-stamp=""
        className="text-[11px] text-[var(--text-muted)] pt-1"
      >
        Survive Sunday · {weekLabel} · for friends, not betting
      </p>
    </div>
  );
}
