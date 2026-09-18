import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { Chip } from "@/components/ui";
import { ScheduleGameRow } from "./ScheduleGameRow";
import type { ScheduleScreenProps } from "./types";

export function ScheduleScreen(props: ScheduleScreenProps) {
  const isCurrent = props.selectedWeek === props.focusWeek;
  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Schedule
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Plan strong picks — tap a team for research. Live and final scores
          refresh from ESPN while games are on.
        </p>
      </div>

      <WeekSwitcher
        weeks={props.weekOptions}
        selectedWeek={props.selectedWeek}
        currentWeek={props.focusWeek}
        basePath="/schedule"
        allowFuture
      />

      <LiveScoresRefresh weekNumber={props.selectedWeek} poll={props.poll} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="font-display text-xl text-gold-400 tracking-wide">
            {props.weekLabel}
          </h2>
          <Chip
            tone={isCurrent ? "gold" : "one-loss"}
            className="text-[10px]"
          >
            {isCurrent
              ? "This week"
              : props.selectedWeek < props.focusWeek
                ? "Past"
                : "Upcoming"}
          </Chip>
          <span className="text-xs text-[var(--text-muted)]">
            Lock: {props.lockLabel}
            {props.locked ? " · Locked" : " · Open"}
          </span>
        </div>

        {props.games.length === 0 ? (
          <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
            Games coming — not seeded yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {props.games.map((game) => (
              <ScheduleGameRow key={game.id} game={game} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
