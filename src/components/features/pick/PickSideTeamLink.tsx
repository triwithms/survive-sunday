import Link from "next/link";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import type { PickSide } from "./types";

export function PickSideTeamLink({
  side,
  reverse,
}: {
  side: PickSide;
  reverse?: boolean;
}) {
  return (
    <Link
      href={`/team/${side.abbr}`}
      prefetch={false}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Team details for ${side.name}`}
      className={`flex items-center gap-1.5 sm:gap-2 min-h-11 min-w-0 rounded-md hover:opacity-90 active:bg-gold-400/5 ${
        reverse ? "flex-row-reverse" : ""
      }`}
    >
      <TeamLogo
        abbr={side.abbr}
        logoUrl={side.logoUrl}
        size={TEAM_LOGO_SIZE.slate}
      />
      <div className="min-w-0">
        <span className="font-mono text-sm font-semibold text-gold-400 underline underline-offset-2 decoration-gold-400/40">
          {side.abbr}
        </span>
        <div className="break-words text-xs text-[var(--text-muted)] underline underline-offset-2 decoration-transparent hover:decoration-[var(--text-muted)]">
          {side.name}
        </div>
      </div>
    </Link>
  );
}
