import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { InjuryStatusChip } from "@/components/InjuryStatusChip";
import { playerHref } from "@/components/NflPlayerRows";
import {
  findKeyOrRosterPlayer,
  getTeamProfile,
  listKeyPlayers,
  withLiveInjuries,
} from "@/lib/team-research";
import { getTeamInjuries } from "@/lib/live-injuries";
import { roleLabel, sideLabel } from "@/lib/nfl-player";
import { formatKickoff } from "@/lib/utils";
import { teamLogoUrl } from "@/lib/espn-teams";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatUpdated(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(t));
  } catch {
    return iso.slice(0, 10);
  }
}

export default async function NflPlayerPage({
  params,
}: {
  params: Promise<{ abbr: string; slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");

  const { abbr: rawAbbr, slug: rawSlug } = await params;
  const abbr = (rawAbbr === "WSH" ? "WAS" : rawAbbr).toUpperCase();
  const slug = decodeURIComponent(rawSlug || "");
  const team = await prisma.team.findUnique({ where: { abbr } });
  if (!team) notFound();

  const found = findKeyOrRosterPlayer(abbr, slug);
  if (!found) notFound();

  const injuries = await getTeamInjuries(abbr);
  const player =
    withLiveInjuries([found], injuries.injuries)[0] ?? found;
  const profile = getTeamProfile(abbr);
  const injury = player.injury;
  const teammates = withLiveInjuries(
    listKeyPlayers(abbr).filter((p) => p.slug !== player.slug),
    injuries.injuries
  );

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

  return (
    <div className="team-research space-y-5 min-w-0 text-base leading-relaxed">
      <div className="flex flex-wrap gap-3 text-base">
        <Link
          href={`/team/${abbr}`}
          prefetch={false}
          className="text-gold-400 underline underline-offset-2"
        >
          ← {team.abbr} research
        </Link>
        <Link
          href="/pick"
          prefetch={false}
          className="text-[var(--text-muted)] underline underline-offset-2 hover:text-gold-400"
        >
          This week&apos;s games
        </Link>
      </div>

      <header className="card-glass p-4 flex items-start gap-3 min-w-0">
        <TeamLogo
          abbr={team.abbr}
          logoUrl={teamLogoUrl(team.abbr, team.logoUrl)}
          size={TEAM_LOGO_SIZE.featured}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            {team.name}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-gold-400 tracking-wide break-words">
            {player.name}
          </h1>
          <p className="text-base text-[var(--text-muted)] mt-1">
            <span className="font-mono text-[var(--text-primary)]">
              {player.number != null ? `#${player.number}` : "—"}
            </span>{" "}
            · {player.position} · {sideLabel(player.side)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="chip chip-gold">{roleLabel(player.role)}</span>
            {player.keyPlayer && (
              <span className="chip chip-live">Key player</span>
            )}
            {injury && <InjuryStatusChip status={injury.status} />}
          </div>
        </div>
      </header>

      <section className="card-glass p-4 space-y-2 text-sm">
        <h2 className="text-lg font-semibold text-gold-400">Player details</h2>
        <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2 text-base">
          <dt className="text-[var(--text-muted)]">College</dt>
          <dd>{player.college || "—"}</dd>
          <dt className="text-[var(--text-muted)]">Side</dt>
          <dd>{sideLabel(player.side)}</dd>
          <dt className="text-[var(--text-muted)]">Depth role</dt>
          <dd>{roleLabel(player.role)}</dd>
        </dl>
        <p className="text-xs text-[var(--text-muted)] pt-1 leading-relaxed">
          Research for survivor picks — not official NFL stats or a wagering
          card. Roster roles may be approximate.
        </p>
      </section>

      {injury && (
        <section className="card-glass p-4 space-y-2 border border-crimson-400/30">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-gold-400">Injury note</h2>
            <InjuryStatusChip status={injury.status} />
            <span className="chip chip-gold text-xs">ESPN report</span>
          </div>
          <p className="text-base">{injury.injury}</p>
          {injury.comment && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {injury.comment}
            </p>
          )}
          {formatUpdated(injury.updated) && (
            <p className="text-xs text-[var(--text-muted)]">
              Updated {formatUpdated(injury.updated)}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Same ESPN public injury report as the team page — not the official
            NFL club report and not medical advice.
            {injury.playerUrl ? (
              <>
                {" "}
                <a
                  href={injury.playerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-gold-400"
                >
                  ESPN player card
                </a>
              </>
            ) : null}
          </p>
        </section>
      )}

      {game && opponentAbbr && (
        <section className="card-glass p-4 space-y-1 text-sm">
          <h2 className="text-lg font-semibold text-gold-400">This week</h2>
          <p>
            {atHome ? "Home" : "Away"} vs{" "}
            <Link
              href={`/team/${opponentAbbr}`}
              prefetch={false}
              className="font-mono text-gold-400 underline underline-offset-2"
            >
              {opponentAbbr}
            </Link>
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {formatKickoff(game.kickoff)}
            {game.network ? ` · ${game.network}` : ""}
          </p>
        </section>
      )}

      {profile && (
        <section className="card-glass p-4 space-y-1 text-sm">
          <h2 className="text-lg font-semibold text-gold-400">Team style</h2>
          <p>
            <span className="text-[var(--text-muted)]">Offence:</span>{" "}
            {profile.offence_lean}
            {" · "}
            <span className="text-[var(--text-muted)]">Defence:</span>{" "}
            {profile.defence_lean}
          </p>
        </section>
      )}

      {teammates.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gold-400">
            Other key players
          </h2>
          <ul className="space-y-2">
            {teammates.map((p) => (
              <li key={p.slug}>
                <Link
                  href={playerHref(abbr, p.slug)}
                  prefetch={false}
                  className="card-glass flex items-center justify-between gap-2 p-3 min-h-11 hover:border-gold-400/50"
                >
                  <span className="min-w-0">
                    <span className="font-medium break-words">{p.name}</span>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {p.position}
                      {p.number != null ? ` · #${p.number}` : ""}
                    </span>
                  </span>
                  {p.injury && <InjuryStatusChip status={p.injury.status} compact />}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
