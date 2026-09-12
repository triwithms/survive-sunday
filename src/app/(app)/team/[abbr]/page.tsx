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
  splitRosterBySide,
  type ProfilePlayer,
} from "@/lib/team-research";
import { formatWinPct } from "@/lib/standings-format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function PlayerRows({ players }: { players: ProfilePlayer[] }) {
  return (
    <ul className="divide-y divide-stadium-border">
      {players.map((p) => (
        <li
          key={`${p.number}-${p.name}`}
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
  const players = profile?.top_players ?? [];
  const sides = splitRosterBySide(players);

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
          <h2 className="font-semibold text-gold-400">
            Demo starters / key players
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Seeded starting units from team profiles — not a full depth chart.
          </p>
        </div>

        {players.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No profile seed yet.</p>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gold-400 flex items-center gap-2">
                Starting offence
                <span className="chip chip-gold text-[10px]">
                  {sides.offence.length}
                </span>
              </h3>
              {sides.offence.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">None in seed.</p>
              ) : (
                <PlayerRows players={sides.offence} />
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-stadium-border">
              <h3 className="text-sm font-medium text-gold-400 flex items-center gap-2">
                Starting defence
                <span className="chip chip-gold text-[10px]">
                  {sides.defence.length}
                </span>
              </h3>
              {sides.defence.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">None in seed.</p>
              ) : (
                <PlayerRows players={sides.defence} />
              )}
            </div>

            {sides.other.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stadium-border">
                <h3 className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2">
                  Other
                  <span className="chip chip-one-loss text-[10px]">
                    {sides.other.length}
                  </span>
                </h3>
                <PlayerRows players={sides.other} />
              </div>
            )}
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
