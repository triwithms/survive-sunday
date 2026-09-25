import Link from "next/link";
import { Card } from "@/components/ui";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { formatKickoff } from "@/lib/utils";
import { formatMatchupListLine } from "@/lib/game-display";
import { pickedSpreadLine, selectedPick, sideMeta } from "./pick-format";
import type { PickMatchup } from "./types";

export function PickCurrentCard({
  games,
  selectedAbbr,
  readOnly,
  changeHint,
  emptyMessage,
  saving,
}: {
  games: PickMatchup[];
  selectedAbbr: string | null;
  readOnly: boolean;
  changeHint?: string | null;
  emptyMessage: string;
  saving?: boolean;
}) {
  const { matchup, side } = selectedPick(games, selectedAbbr);
  const listLine = matchup ? formatMatchupListLine(matchup) : null;
  const status = listLine
    ? listLine
    : matchup?.kickoff
      ? formatKickoff(matchup.kickoff)
      : "";
  const spread = side && matchup ? pickedSpreadLine(matchup, side.abbr) : null;
  const meta = side ? sideMeta(side) : "";

  return (
    <Card
      as="section"
      className="p-4 border border-gold-400/30"
      aria-label="Your current pick"
    >
      <p className="text-lg font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
        Your pick{saving ? " · Saving…" : ""}
      </p>
      {side ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TeamLogo
              abbr={side.abbr}
              logoUrl={side.logoUrl}
              size={TEAM_LOGO_SIZE.featured}
            />
            <div className="min-w-0">
              <p className="font-mono text-2xl font-bold text-gold-400 leading-none">
                {side.abbr}
              </p>
              <p className="text-base font-medium text-[var(--text-primary)] break-words mt-1">
                {side.name}
              </p>
              {status ? (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{status}</p>
              ) : null}
              {spread ? (
                <p className="text-xs text-[var(--text-primary)] mt-0.5">{spread}</p>
              ) : null}
              {meta ? (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{meta}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/team/${side.abbr}`}
              prefetch={false}
              className="btn-secondary text-sm"
            >
              Team details
            </Link>
            {!readOnly && changeHint ? (
              <span className="text-xs text-[var(--text-muted)]">{changeHint}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>
      )}
    </Card>
  );
}
