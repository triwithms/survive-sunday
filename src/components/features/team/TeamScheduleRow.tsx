import Link from "next/link";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { Chip } from "@/components/ui";
import { teamHref } from "./team-paths";
import type { TeamGameResult, TeamScheduleItem } from "./team-schedule";

const RESULT_LABEL: Record<TeamGameResult, string> = {
  win: "Win",
  loss: "Loss",
  tie: "Tie",
};

function ResultChip({ result }: { result: TeamGameResult }) {
  const tone = result === "win" ? "gold" : result === "loss" ? "eliminated" : "one-loss";
  return (
    <Chip tone={tone} className="text-sm font-semibold">
      {RESULT_LABEL[result]}
    </Chip>
  );
}

export function TeamScheduleRow({ game }: { game: TeamScheduleItem }) {
  if (game.bye) {
    return (
      <li className="card-glass p-3 min-w-0 flex items-center gap-3 min-h-11">
        <span className="text-sm text-[var(--text-muted)]">Week {game.week}</span>
        <span className="text-base text-[var(--text-muted)]">Bye</span>
      </li>
    );
  }
  const opp = game.opponentAbbr!;
  return (
    <li className="card-glass p-3 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <TeamLogo abbr={opp} size={TEAM_LOGO_SIZE.compact} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm text-[var(--text-muted)]">Week {game.week}</p>
          <p className="text-base">
            {game.atHome ? "vs" : "at"}{" "}
            <Link
              href={teamHref(opp)}
              prefetch={false}
              className="font-mono font-semibold text-gold-400 underline underline-offset-2"
            >
              {opp}
            </Link>
          </p>
          {game.status === "final" ? (
            <p className="flex flex-wrap items-center gap-2 pt-0.5">
              {game.result ? <ResultChip result={game.result} /> : (
                <span className="text-sm text-[var(--text-muted)]">Final</span>
              )}
              {game.scoreLine && (
                <span className="font-mono text-lg tabular-nums">{game.scoreLine}</span>
              )}
            </p>
          ) : game.status === "live" ? (
            <p className="flex flex-wrap items-center gap-2 pt-0.5">
              <Chip tone="live" className="text-sm font-semibold">Live</Chip>
              {game.scoreLine && (
                <span className="font-mono text-lg tabular-nums">{game.scoreLine}</span>
              )}
              {game.liveClock && (
                <span className="text-sm text-[var(--text-muted)]">{game.liveClock}</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">{game.kickoffLabel}</p>
          )}
        </div>
      </div>
    </li>
  );
}
