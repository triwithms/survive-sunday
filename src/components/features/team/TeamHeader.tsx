import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import type { TeamHeaderView } from "./types";

export function TeamHeader({ header }: { header: TeamHeaderView }) {
  return (
    <header className="card-glass p-4 flex items-start gap-3 min-w-0">
      <TeamLogo
        abbr={header.abbr}
        logoUrl={header.logoUrl}
        size={TEAM_LOGO_SIZE.hero}
      />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl sm:text-4xl text-gold-400 tracking-wide break-words">
          {header.name}
        </h1>
        <p className="text-base text-[var(--text-muted)]">
          {header.conference} {header.division} ·{" "}
          <span className="font-mono text-[var(--text-primary)]">
            {header.abbr}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <span className="chip chip-gold">{header.record}</span>
          <span className="chip chip-one-loss">{header.winPct} pct</span>
          {header.standing && (
            <span className="chip chip-one-loss">{header.standing}</span>
          )}
          {header.priorYear && (
            <span className="chip chip-one-loss">{header.priorYear}</span>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          PF {header.pointsFor} · PA {header.pointsAgainst}
        </p>
      </div>
    </header>
  );
}
