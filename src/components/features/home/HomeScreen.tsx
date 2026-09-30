import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { SectionBoundary } from "@/components/SectionBoundary";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { HomeWeekHeader } from "./HomeWeekHeader";
import { SelectionsList } from "./SelectionsList";
import type { HomeScreenProps } from "./types";

export function HomeScreen(props: HomeScreenProps) {
  return (
    <div className="space-y-6">
      {props.startNotice ? (
        <div>
          <h1 className="font-display text-2xl tracking-wide text-gold-400">
            Selections
          </h1>
          <p
            role="status"
            data-testid="pool-start-banner"
            className="text-sm text-[var(--text-muted)] mt-1"
          >
            {props.startNotice}
          </p>
        </div>
      ) : (
        <SectionBoundary name="home-week-header" variant="inline" resetKey={props.selectedWeek}>
          <HomeWeekHeader
            label={props.weekLabel}
            lockAt={props.lockAt}
            revealAllPicks={props.revealAllPicks}
          />
        </SectionBoundary>
      )}
      {props.startNotice ? null : (
      <WeekSwitcher
        weeks={props.weekOptions}
        selectedWeek={props.selectedWeek}
        currentWeek={props.focusWeek}
        basePath="/pool"
      />
      )}
      {props.startNotice ? null : (
        <SectionBoundary
          name="home-live-refresh"
          variant="inline"
          message="Live score refresh paused."
          resetKey={props.selectedWeek}
        >
          <LiveScoresRefresh weekNumber={props.selectedWeek} poll={props.poll} />
        </SectionBoundary>
      )}
      {props.startNotice ? null : (
      <SelectionsList
        rows={props.rows}
        selfId={props.selfId}
        revealAllPicks={props.revealAllPicks}
      />
      )}
    </div>
  );
}
