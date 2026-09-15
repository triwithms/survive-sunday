import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import {
  formatCurrentStanding,
  formatPriorYearRank,
  resolveFavourite,
} from "@/lib/matchup-meta";
import {
  getTeamNews,
  getTeamProfile,
  getTeamRoster,
  listKeyPlayers,
  listNflPlayers,
  splitRosterPlayers,
  withLiveInjuries,
  type NflPlayerView,
  type TeamNewsItem,
} from "@/lib/team-research";
import { getTeamInjuries, type LiveInjury } from "@/lib/live-injuries";
import { getTeamCoach } from "@/lib/team-coaches";
import { formatWinPct } from "@/lib/standings-format";
import { teamLogoUrl } from "@/lib/espn-teams";
import { InjuryChip } from "@/components/InjuryChip";
import { isDemoMode } from "@/lib/pool-mode";
import { formatKickoff } from "@/lib/utils";
import { formatMatchupListLine } from "@/lib/game-display";
import { namesMatch } from "@/lib/nfl-player";
import { KeyPlayerCards, NflPlayerRows, playerHref } from "@/components/NflPlayerRows";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function SideSections({
  title,
  teamAbbr,
  players,
  rolesApproximate,
}: {
  title: string;
  teamAbbr: string;
  players: NflPlayerView[];
  rolesApproximate: boolean;
}) {
  if (players.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gold-400">{title}</h3>
        <p className="text-base text-[var(--text-muted)]">None listed.</p>
      </div>
    );
  }

  const { starters, depth } = splitRosterPlayers(players);
  const hasRoleSplit = starters.length > 0 && depth.length > 0;

  if (!hasRoleSplit) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gold-400 flex items-center gap-2">
          {title}
          <span className="chip chip-gold text-xs">{players.length}</span>
        </h3>
        <NflPlayerRows teamAbbr={teamAbbr} players={players} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gold-400 flex items-center gap-2">
          Starting {title.toLowerCase()}
          <span className="chip chip-gold text-xs">{starters.length}</span>
          {rolesApproximate && (
            <span className="text-xs font-normal text-[var(--text-muted)]">
              approx
            </span>
          )}
        </h3>
        <NflPlayerRows teamAbbr={teamAbbr} players={starters} />
      </div>
      <div className="space-y-2 pt-2 border-t border-stadium-border">
        <h3 className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
          {title} depth
          <span className="chip chip-one-loss text-xs">{depth.length}</span>
        </h3>
        <NflPlayerRows teamAbbr={teamAbbr} players={depth} />
      </div>
    </div>
  );
}


function formatNewsDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(t));
  } catch {
    return iso.slice(0, 10);
  }
}

function formatInjuryWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(t));
  } catch {
    return iso.slice(0, 10);
  }
}

function statusChipClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "out" || s === "suspension" || s === "suspended") {
    return "chip-eliminated";
  }
  if (s === "doubtful") return "chip-live";
  return "chip-one-loss";
}

function InjuryList({
  rows,
  teamAbbr,
  players,
}: {
  rows: LiveInjury[];
  teamAbbr: string;
  players: NflPlayerView[];
}) {
  return (
    <ul className="divide-y divide-stadium-border text-sm">
      {rows.map((row) => {
        const when = formatInjuryWhen(row.updated);
        const rosterMatch = players.find((p) => namesMatch(p.name, row.player));
        const name = rosterMatch ? (
          <Link
            href={playerHref(teamAbbr, rosterMatch.slug)}
            prefetch={false}
            className="font-medium underline decoration-gold-400/40 underline-offset-2 hover:decoration-gold-400"
          >
            {row.player}
          </Link>
        ) : row.playerUrl ? (
          <a
            href={row.playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline decoration-gold-400/40 underline-offset-2 hover:decoration-gold-400"
          >
            {row.player}
          </a>
        ) : (
          <span className="font-medium">{row.player}</span>
        );
        return (
          <li key={`${row.player}-${row.status}-${row.injury}`} className="py-2.5 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-gold-400 w-8 shrink-0">
                {row.position}
              </span>
              <span className="min-w-0 flex-1 break-words">{name}</span>
              <span className={`chip text-xs shrink-0 ${statusChipClass(row.status)}`}>
                {row.status}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pl-10">
              {row.injury}
              {when ? ` · ${when}` : ""}
            </p>
            {row.comment && (
              <p className="text-xs text-[var(--text-muted)] pl-10 leading-relaxed">
                {row.comment}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function NewsList({ items }: { items: TeamNewsItem[] }) {
  return (
    <ul className="space-y-3 text-base">
      {items.map((n, i) => {
        const when = formatNewsDate(n.published);
        return (
          <li
            key={`${n.url}-${i}`}
            className="rounded-lg bg-[var(--stadium-700)]/40 p-3"
          >
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--text-primary)] underline decoration-gold-400/40 underline-offset-2 hover:decoration-gold-400"
            >
              {n.headline}
            </a>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <span className="chip chip-one-loss text-xs normal-case tracking-normal">
                {n.source}
              </span>
              {when && <span className="normal-case tracking-normal">{when}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function TeamResearchPage({
  params,
}: {
  params: Promise<{ abbr: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const { abbr: raw } = await params;
  const abbr = (raw === "WSH" ? "WAS" : raw).toUpperCase();
  const team = await prisma.team.findUnique({ where: { abbr } });
  if (!team) notFound();

  const profile = getTeamProfile(abbr);
  const roster = getTeamRoster(abbr);
  const [news, injuries, coach] = await Promise.all([
    getTeamNews(abbr),
    getTeamInjuries(abbr),
    getTeamCoach(abbr),
  ]);
  const players = withLiveInjuries(listNflPlayers(abbr), injuries.injuries);
  const keyPlayers = withLiveInjuries(listKeyPlayers(abbr), injuries.injuries);
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: me.poolId, number: me.pool.currentWeek },
    },
    include: { games: true },
  });
  const game = week?.games.find(
    (g) => g.awayAbbr === abbr || g.homeAbbr === abbr
  );
  const opponentAbbr = game
    ? game.awayAbbr === abbr
      ? game.homeAbbr
      : game.awayAbbr
    : null;
  const atHome = game ? game.homeAbbr === abbr : false;
  const thisWeekLine = game ? formatMatchupListLine(game) : null;
  const thisWeekFav = game
    ? resolveFavourite({
        homeAbbr: game.homeAbbr,
        awayAbbr: game.awayAbbr,
        spreadHome: game.spreadHome,
        spreadAway: game.spreadAway,
        mlHome: game.mlHome,
        mlAway: game.mlAway,
      })
    : null;
  const standing = {
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    divisionRank: team.divisionRank,
    conference: team.conference,
    division: team.division,
  };
  const record =
    team.ties > 0
      ? `${team.wins}-${team.losses}-${team.ties}`
      : `${team.wins}-${team.losses}`;

  const offence = players.filter((p) => p.side === "offence");
  const defence = players.filter((p) => p.side === "defence");
  const special = players.filter((p) => p.side === "special_teams");
  const stCount = special.length;
  const totalPlayers = players.length;

  return (
    <div className="team-research space-y-5 min-w-0 text-base leading-relaxed">
      <div className="flex flex-wrap gap-3 text-base">
        <Link
          href="/nfl"
          prefetch={false}
          className="text-gold-400 underline underline-offset-2"
        >
          ← NFL standings
        </Link>
        <Link
          href="/pick"
          prefetch={false}
          className="text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400"
        >
          This week&apos;s games
        </Link>
        <Link
          href="/schedule"
          prefetch={false}
          className="text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400"
        >
          Schedule
        </Link>
      </div>

      <header className="card-glass p-4 flex items-start gap-3 min-w-0">
        <TeamLogo
          abbr={team.abbr}
          logoUrl={teamLogoUrl(team.abbr, team.logoUrl)}
          size={TEAM_LOGO_SIZE.hero}
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl sm:text-4xl text-gold-400 tracking-wide break-words">
            {team.name}
          </h1>
          <p className="text-base text-[var(--text-muted)]">
            {team.conference} {team.division} ·{" "}
            <span className="font-mono text-[var(--text-primary)]">{team.abbr}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="chip chip-gold">{record}</span>
            <span className="chip chip-one-loss">
              {formatWinPct(team.wins, team.losses, team.ties)} pct
            </span>
            {formatCurrentStanding(standing) && (
              <span className="chip chip-one-loss">
                {formatCurrentStanding(standing)}
              </span>
            )}
            {formatPriorYearRank(team.priorYearRank) && (
              <span className="chip chip-one-loss">
                {formatPriorYearRank(team.priorYearRank)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            PF {team.pointsFor} · PA {team.pointsAgainst} ·{" "}
            <span className="text-gold-400">
              {isDemoMode(me.pool.mode) ? "Demo standings" : "League standings"}
            </span>
          </p>
        </div>
      </header>

      {game && opponentAbbr && (
        <section className="card-glass p-4 space-y-1">
          <h2 className="text-xl font-semibold text-gold-400">This week</h2>
          <p className="text-base">
            {atHome ? "Home" : "Away"} vs{" "}
            <Link
              href={`/team/${opponentAbbr}`}
              prefetch={false}
              className="font-mono text-gold-400 underline underline-offset-2"
            >
              {opponentAbbr}
            </Link>
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            {formatKickoff(game.kickoff)}
            {game.network ? ` · ${game.network}` : ""}
          </p>
          {thisWeekLine && (
            <p className="text-sm text-[var(--text-muted)]">{thisWeekLine}</p>
          )}
          {thisWeekFav && (
            <p className="text-sm font-mono text-[var(--text-primary)]">
              {thisWeekFav.label}
            </p>
          )}
        </section>
      )}

      <section className="card-glass p-4 space-y-2">
        <h2 className="text-xl font-semibold text-gold-400">Coach</h2>
        {coach.name ? (
          <>
            <p className="text-lg font-medium break-words">{coach.name}</p>
            {coach.experienceLabel && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {coach.experienceLabel}
              </p>
            )}
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-base pt-1">
              {coach.espnCoachUrl && (
                <li>
                  <a
                    href={coach.espnCoachUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-400 underline underline-offset-2"
                  >
                    ESPN profile
                  </a>
                </li>
              )}
              {coach.wikipediaUrl && (
                <li>
                  <a
                    href={coach.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-400 underline underline-offset-2"
                  >
                    Wikipedia
                  </a>
                </li>
              )}
              <li>
                <a
                  href={coach.espnTeamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400"
                >
                  ESPN team page
                </a>
              </li>
              <li>
                <a
                  href={coach.nflTeamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400"
                >
                  NFL.com team page
                </a>
              </li>
            </ul>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed pt-1">
              Head coach from ESPN&apos;s public coaches list
              {coach.asOf ? ` (seeded ${coach.asOf})` : ""}. Opens in a new tab.
              Not a bio — tap a link for more.
            </p>
          </>
        ) : (
          <div className="space-y-2 text-base text-[var(--text-muted)]">
            <p>
              Coach name isn&apos;t listed right now. Look them up on the team
              pages:
            </p>
            <ul className="flex flex-wrap gap-3 text-base">
              <li>
                <a
                  href={coach.espnTeamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 underline underline-offset-2"
                >
                  ESPN · {team.abbr}
                </a>
              </li>
              <li>
                <a
                  href={coach.nflTeamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 underline underline-offset-2"
                >
                  NFL.com · {team.abbr}
                </a>
              </li>
            </ul>
          </div>
        )}
      </section>

      {profile && (
        <section className="card-glass p-4 space-y-2">
          <h2 className="text-xl font-semibold text-gold-400">Style summary</h2>
          <ul className="text-base space-y-1.5">
            <li>
              <span className="text-[var(--text-muted)]">Offence:</span>{" "}
              {profile.offence_lean}
            </li>
            <li>
              <span className="text-[var(--text-muted)]">Defence:</span>{" "}
              {profile.defence_lean}
            </li>
            <li>
              <span className="text-[var(--text-muted)]">Run / pass:</span>{" "}
              {profile.run_pass_lean}
            </li>
          </ul>
          {profile.lean_basis && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {profile.lean_basis}
            </p>
          )}
        </section>
      )}

      {keyPlayers.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-gold-400">Key players</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Tap a name for college, depth role, and any ESPN injury note.
            </p>
          </div>
          <KeyPlayerCards teamAbbr={team.abbr} players={keyPlayers} />
        </section>
      )}

      <section className="card-glass p-4 space-y-4 text-sm">
        <div>
          <h2 className="text-lg font-semibold text-gold-400 flex items-center gap-2 flex-wrap">
            Roster
            {totalPlayers > 0 && (
              <span className="chip chip-gold text-xs">{totalPlayers}</span>
            )}
            {roster?.rolesApproximate && (
              <span className="chip chip-one-loss text-xs">
                Roster · roles approximate
              </span>
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 leading-relaxed">
            {roster?.fromFullFile
              ? `Full roster from ${roster.source || "team_rosters.json"}${
                  roster.asOf ? ` · as of ${roster.asOf}` : ""
                }. Tap a player for details. ${
                  isDemoMode(me.pool.mode)
                    ? "Demo research only — not official NFL depth charts for wagering."
                    : "Research only — not official NFL depth charts for wagering."
                }`
              : "Seeded key players from team profiles — not a full depth chart. Tap a name for details."}
          </p>
          {roster?.sourceNote && (
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              {roster.sourceNote}
            </p>
          )}
        </div>

        {!roster || totalPlayers === 0 ? (
          <p className="text-base text-[var(--text-muted)]">No roster data yet.</p>
        ) : (
          <>
            <SideSections
              title="Offence"
              teamAbbr={team.abbr}
              players={offence}
              rolesApproximate={roster.rolesApproximate}
            />
            <div className="border-t border-stadium-border pt-4">
              <SideSections
                title="Defence"
                teamAbbr={team.abbr}
                players={defence}
                rolesApproximate={roster.rolesApproximate}
              />
            </div>
            <div className="border-t border-stadium-border pt-4 space-y-2">
              <h3 className="text-sm font-medium text-gold-400 flex items-center gap-2">
                Special teams
                <span className="chip chip-gold text-xs">{stCount}</span>
              </h3>
              {stCount === 0 ? (
                <p className="text-base text-[var(--text-muted)]">
                  None listed (ESPN often omits KR/PR as distinct positions).
                </p>
              ) : (
                <NflPlayerRows teamAbbr={team.abbr} players={special} />
              )}
            </div>
          </>
        )}
      </section>

      <section className="card-glass p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold text-gold-400">Injuries</h2>
          {!injuries.failed && injuries.injuries.length > 0 && (
            <span className="chip chip-gold text-xs">ESPN report</span>
          )}
          <InjuryChip counts={injuries.counts} />
        </div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Near-live ESPN public injury report (Out, Doubtful, Questionable, IR,
          suspension). Not the official NFL club report and not medical advice.
          Cached a few minutes; pull to refresh.
        </p>
        {injuries.failed ? (
          <div className="space-y-2 text-base text-[var(--text-muted)]">
            <p>
              Couldn&apos;t load the ESPN injury feed right now. Check the
              official lists:
            </p>
            <ul className="flex flex-wrap gap-3 text-base">
              <li>
                <a
                  href={injuries.espnInjuriesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 underline underline-offset-2"
                >
                  ESPN injuries · {team.abbr}
                </a>
              </li>
              <li>
                <a
                  href={injuries.nflInjuriesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 underline underline-offset-2"
                >
                  NFL.com injuries
                </a>
              </li>
            </ul>
          </div>
        ) : injuries.injuries.length === 0 ? (
          <p className="text-base text-[var(--text-muted)]">
            No Out / Doubtful / Questionable / IR / suspension names on the
            current ESPN report for this team.
          </p>
        ) : (
          <>
            <InjuryList
              rows={injuries.injuries}
              teamAbbr={team.abbr}
              players={players}
            />
            <p className="text-sm text-[var(--text-muted)] pt-1">
              Full lists:{" "}
              <a
                href={injuries.espnInjuriesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-gold-400"
              >
                ESPN
              </a>
              {" · "}
              <a
                href={injuries.nflInjuriesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-gold-400"
              >
                NFL.com
              </a>
            </p>
          </>
        )}
      </section>

      <section className="card-glass p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold text-gold-400">Team news</h2>
          {!news.failed && news.items.length > 0 && (
            <span className="chip chip-gold text-xs">Live · ESPN</span>
          )}
        </div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Headlines from ESPN&apos;s public team news feed, newest first. Opens
          on ESPN in a new tab. Not affiliated with the NFL or ESPN.
        </p>
        {news.failed || news.items.length === 0 ? (
          <div className="space-y-2 text-base text-[var(--text-muted)]">
            <p>
              {news.failed
                ? "Live headlines are unavailable right now."
                : "No recent headlines returned for this team."}{" "}
              Check the team pages directly:
            </p>
            <ul className="flex flex-wrap gap-3 text-base">
              <li>
                <a
                  href={news.espnTeamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 underline underline-offset-2"
                >
                  ESPN · {team.abbr}
                </a>
              </li>
              <li>
                <a
                  href={news.nflTeamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-400 underline underline-offset-2"
                >
                  NFL.com · {team.abbr}
                </a>
              </li>
            </ul>
          </div>
        ) : (
          <>
            <NewsList items={news.items} />
            <p className="text-sm text-[var(--text-muted)] pt-1">
              More coverage:{" "}
              <a
                href={news.espnTeamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-gold-400"
              >
                ESPN
              </a>
              {" · "}
              <a
                href={news.nflTeamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-gold-400"
              >
                NFL.com
              </a>
            </p>
          </>
        )}
      </section>
    </div>
  );
}
