import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { TeamLogo } from "@/components/TeamLogo";
import {
  formatCurrentStanding,
  formatPriorYearRank,
} from "@/lib/matchup-meta";
import {
  getSampleInjuryNews,
  getTeamProfile,
  getTeamRoster,
  splitRosterPlayers,
  type RosterPlayer,
} from "@/lib/team-research";
import { formatWinPct } from "@/lib/standings-format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function PlayerRows({ players }: { players: RosterPlayer[] }) {
  return (
    <ul className="divide-y divide-stadium-border">
      {players.map((p) => (
        <li
          key={`${p.role}-${p.number}-${p.name}-${p.position}`}
          className="py-2 flex items-baseline gap-2 text-sm min-w-0"
        >
          <span className="font-mono text-[var(--text-muted)] w-8 shrink-0">
            {p.number != null ? `#${p.number}` : "—"}
          </span>
          <span className="font-mono text-xs text-gold-400 w-8 shrink-0">
            {p.position}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
          <span className="text-xs text-[var(--text-muted)] truncate max-w-[40%]">
            {p.college || "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SideSections({
  title,
  players,
  rolesApproximate,
}: {
  title: string;
  players: RosterPlayer[];
  rolesApproximate: boolean;
}) {
  if (players.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gold-400">{title}</h3>
        <p className="text-sm text-[var(--text-muted)]">None listed.</p>
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
          <span className="chip chip-gold text-[10px]">{players.length}</span>
        </h3>
        <PlayerRows players={players} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gold-400 flex items-center gap-2">
          Starting {title.toLowerCase()}
          <span className="chip chip-gold text-[10px]">{starters.length}</span>
          {rolesApproximate && (
            <span className="text-[10px] font-normal text-[var(--text-muted)]">
              approx
            </span>
          )}
        </h3>
        <PlayerRows players={starters} />
      </div>
      <div className="space-y-2 pt-2 border-t border-stadium-border">
        <h3 className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
          {title} depth
          <span className="chip chip-one-loss text-[10px]">{depth.length}</span>
        </h3>
        <PlayerRows players={depth} />
      </div>
    </div>
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
  const sample = getSampleInjuryNews(abbr);
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

  const oCount = roster?.offence.length ?? 0;
  const dCount = roster?.defence.length ?? 0;
  const stCount = roster?.special_teams.length ?? 0;
  const totalPlayers = oCount + dCount + stCount;

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-wrap gap-3 text-sm">
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
          Pick slate
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
        <TeamLogo abbr={team.abbr} logoUrl={team.logoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl text-gold-400 tracking-wide break-words">
            {team.name}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {team.conference} {team.division} ·{" "}
            <span className="font-mono text-[var(--text-primary)]">{team.abbr}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
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
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            PF {team.pointsFor} · PA {team.pointsAgainst} ·{" "}
            <span className="text-gold-400">Demo standings</span>
          </p>
        </div>
      </header>

      {profile && (
        <section className="card-glass p-4 space-y-2">
          <h2 className="font-semibold text-gold-400">Style summary</h2>
          <ul className="text-sm space-y-1">
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
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {profile.lean_basis}
            </p>
          )}
        </section>
      )}

      <section className="card-glass p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-gold-400 flex items-center gap-2 flex-wrap">
            Roster
            {totalPlayers > 0 && (
              <span className="chip chip-gold text-[10px]">{totalPlayers}</span>
            )}
            {roster?.rolesApproximate && (
              <span className="chip chip-one-loss text-[10px]">
                Roster · roles approximate
              </span>
            )}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
            {roster?.fromFullFile
              ? `Full roster from ${roster.source || "team_rosters.json"}${
                  roster.asOf ? ` · as of ${roster.asOf}` : ""
                }. Demo research only — not official NFL depth charts for wagering.`
              : "Seeded key players from team profiles — not a full depth chart."}
          </p>
          {roster?.sourceNote && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
              {roster.sourceNote}
            </p>
          )}
        </div>

        {!roster || totalPlayers === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No roster data yet.</p>
        ) : (
          <>
            <SideSections
              title="Offence"
              players={roster.offence}
              rolesApproximate={roster.rolesApproximate}
            />
            <div className="border-t border-stadium-border pt-4">
              <SideSections
                title="Defence"
                players={roster.defence}
                rolesApproximate={roster.rolesApproximate}
              />
            </div>
            <div className="border-t border-stadium-border pt-4 space-y-2">
              <h3 className="text-sm font-medium text-gold-400 flex items-center gap-2">
                Special teams
                <span className="chip chip-gold text-[10px]">{stCount}</span>
              </h3>
              {stCount === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  None listed (ESPN often omits KR/PR as distinct positions).
                </p>
              ) : (
                <PlayerRows players={roster.special_teams} />
              )}
            </div>
          </>
        )}
      </section>

      <section className="card-glass p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-semibold text-gold-400">Injuries / news</h2>
          <span className="chip chip-gold text-[10px]">Demo sample</span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          From sample_injury_news.json — fictional stubs or historical shape
          only. Not live 2026 reports.
        </p>
        {sample.injuries.length === 0 && sample.news.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No sample rows for {team.abbr}.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {sample.injuries.map((inj, i) => (
              <li key={`inj-${i}`} className="rounded-lg bg-[var(--stadium-700)]/40 p-3">
                <div className="font-medium">
                  {inj.player}{" "}
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {inj.position}
                  </span>
                </div>
                <div className="text-xs mt-0.5">
                  <span className="text-crimson-400">{inj.status}</span>
                  {" · "}
                  {inj.injury}
                </div>
              </li>
            ))}
            {sample.news.map((n, i) => (
              <li key={`news-${i}`} className="rounded-lg bg-[var(--stadium-700)]/40 p-3">
                <div className="text-sm">{n.headline}</div>
                {n._label && (
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wide">
                    {n._label}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
