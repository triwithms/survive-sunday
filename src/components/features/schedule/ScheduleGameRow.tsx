import Link from "next/link";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { Chip } from "@/components/ui";
import type { ScheduleGame } from "./types";

export function ScheduleGameRow({ game }: { game: ScheduleGame }) {
  return (
    <li className="card-glass p-3 min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Link
          href={`/team/${game.awayAbbr}`}
          prefetch={false}
          className="inline-flex items-center gap-1.5 min-h-11 px-1 font-semibold text-gold-400 hover:underline underline-offset-2"
        >
          <TeamLogo
            abbr={game.awayAbbr}
            logoUrl={game.awayLogoUrl}
            size={TEAM_LOGO_SIZE.compact}
          />
          {game.awayAbbr}
        </Link>
        <span className="text-[var(--text-muted)]">@</span>
        <Link
          href={`/team/${game.homeAbbr}`}
          prefetch={false}
          className="inline-flex items-center gap-1.5 min-h-11 px-1 font-semibold text-gold-400 hover:underline underline-offset-2"
        >
          <TeamLogo
            abbr={game.homeAbbr}
            logoUrl={game.homeLogoUrl}
            size={TEAM_LOGO_SIZE.compact}
          />
          {game.homeAbbr}
        </Link>
        {game.status === "live" && (
          <Chip tone="live" className="text-[10px]">
            LIVE
          </Chip>
        )}
      </div>
      <div className="mt-1 text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{game.scoreLine}</span>
        {game.favouriteLabel && (
          <span className="text-[var(--text-primary)]">{game.favouriteLabel}</span>
        )}
      </div>
    </li>
  );
}
