import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { WeekSwitcher } from "@/components/WeekSwitcher";
import { HomeVideosTeaser } from "@/components/WeeklyVideosPanel";
import { HomeEmptyPick } from "./HomeEmptyPick";
import { HomeHiddenParticipants } from "./HomeHiddenParticipants";
import { HomePickHero } from "./HomePickHero";
import { HomePicksByGame } from "./HomePicksByGame";
import { HomeWeekHeader } from "./HomeWeekHeader";
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
      {props.hero ? (
        <HomePickHero {...props.hero} />
      ) : props.empty ? (
        <HomeEmptyPick {...props.empty} />
      ) : null}
      <HomeVideosTeaser week={props.selectedWeek} />
      {props.revealAllPicks ? (
        <HomePicksByGame
          games={props.games}
          rows={props.rows}
          selfId={props.selfId}
        />
      ) : (
        <HomeHiddenParticipants rows={props.rows} selfId={props.selfId} />
      )}
    </div>
  );
}
