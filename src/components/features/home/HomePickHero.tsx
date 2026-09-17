import Link from "next/link";
import { Card, StatusBadge, type StatusBadgeStatus } from "@/components/ui";
import { TeamLogo } from "@/components/TeamLogo";
import { TEAM_LOGO_SIZE } from "@/lib/team-logo-size";
import { STATUS_LABELS } from "@/lib/constants";
import type { InjuryCountBits } from "@/lib/game-display";
import { HomePickHeroFacts } from "./HomePickHeroFacts";

export function HomePickHero({
  teamAbbr,
  logoUrl,
  priorStanding,
  gameLine,
  injuryCounts,
  favouriteLabel,
  imported,
  status,
  result,
  actionHref,
  actionLabel,
}: {
  teamAbbr: string;
  logoUrl: string | null;
  priorStanding?: string | null;
  gameLine?: string | null;
  injuryCounts?: InjuryCountBits | null;
  favouriteLabel?: string | null;
  imported?: boolean;
  status: StatusBadgeStatus;
  result?: string | null;
  actionHref?: string | null;
  actionLabel?: string | null;
}) {
  const resultClass =
    result === "win"
      ? "text-field-400"
      : result === "loss"
        ? "text-crimson-400"
        : "text-[var(--text-muted)]";

  return (
    <Card as="section" className="p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
        Your pick
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">
            <TeamLogo
              abbr={teamAbbr}
              logoUrl={logoUrl}
              size={TEAM_LOGO_SIZE.hero}
            />
          </div>
          <HomePickHeroFacts
            teamAbbr={teamAbbr}
            priorStanding={priorStanding}
            gameLine={gameLine}
            injuryCounts={injuryCounts}
            favouriteLabel={favouriteLabel}
            imported={imported}
          />
        </div>
        <div className="text-right">
          <StatusBadge status={status}>{STATUS_LABELS[status]}</StatusBadge>
          {result ? (
            <p className={`text-sm mt-1 font-medium ${resultClass}`}>{result}</p>
          ) : null}
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            prefetch={false}
            className="btn-primary text-center text-sm shrink-0 sm:ml-auto"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
