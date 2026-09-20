import { WeekSwitcher } from "@/components/WeekSwitcher";
import { ScoreGameCard } from "./ScoreGameCard";
import { ScoresHeading } from "./ScoresHeading";
import { ScoresPickRow } from "./ScoresPickRow";
import type { ScoresScreenProps } from "./screen-types";

export function ScoresScreen(props: ScoresScreenProps) {
  return (
    <div
      id="share-scores"
      data-share-root="scores"
      data-share-week={props.heading.weekLabel}
      className="space-y-4 min-w-0"
    >
      <ScoresHeading {...props.heading} poll={props.poll} />
      <div data-share-chrome="">
        <WeekSwitcher
          weeks={props.weekOptions}
          selectedWeek={props.selectedWeek}
          currentWeek={props.focusWeek}
          basePath="/scores"
        />
      </div>
      {props.games.length === 0 ? (
        <div
          className="card-glass p-4 text-sm text-[var(--text-muted)]"
          data-share-chunk=""
          data-share-section="games"
        >
          Games for {props.heading.weekLabel} have not been seeded yet. Check
          back when the games are available.
        </div>
      ) : (
        <ul className="space-y-2" data-share-section="games">
          {props.games.map((game) => (
            <ScoreGameCard
              key={game.id}
              game={game}
              weekNumber={props.selectedWeek}
              startOpen={game.id === props.openGameId}
            />
          ))}
        </ul>
      )}
      <section className="space-y-3" data-share-section="picks">
        <div className="flex flex-wrap items-baseline gap-2" data-share-chunk="">
          <h2 className="font-display text-xl text-gold-400 tracking-wide">
            Participants&apos; picks
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {props.revealAllPicks ? "Picks revealed" : "Others reveal after kickoff"}
          </span>
        </div>
        <ul className="space-y-2">
          {props.rows.map((row) => (
            <ScoresPickRow key={row.id} row={row} />
          ))}
        </ul>
      </section>
      <p data-share-stamp="" className="text-[11px] text-[var(--text-muted)] pt-1">
        Survive Sunday · {props.heading.weekLabel} · for friends, not betting
      </p>
    </div>
  );
}
