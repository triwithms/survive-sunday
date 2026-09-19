import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { HomeWeekHeader } from "./HomeWeekHeader";
import { SelectionsList } from "./SelectionsList";
import type { HomeScreenProps } from "./types";

export function HomeScreen(props: HomeScreenProps) {
  return (
    <div className="space-y-6">
      <HomeWeekHeader
        label={props.weekLabel}
        lockAt={props.lockAt}
        revealAllPicks={props.revealAllPicks}
      />
      <WeekSwitcher
        weeks={props.weekOptions}
        selectedWeek={props.selectedWeek}
        currentWeek={props.focusWeek}
        basePath="/pool"
      />
      <LiveScoresRefresh weekNumber={props.selectedWeek} poll={props.poll} />
      <SelectionsList
        rows={props.rows}
        selfId={props.selfId}
        revealAllPicks={props.revealAllPicks}
      />
    </div>
  );
}
