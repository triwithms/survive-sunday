import { WeekSwitcher } from "@/components/WeekSwitcher";
import { WeeklyVideosPanel } from "@/components/WeeklyVideosPanel";
import type { VideosScreenProps } from "./types";

export function VideosScreen(props: VideosScreenProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-gold-400">
          Videos
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Official NFL (and a few reputable) YouTube videos for {props.weekLabel}
          — <strong>2026/27 season only</strong>, not old archives.{" "}
          <strong>Previews</strong> show until that game’s kickoff; after the
          game, we switch to <strong>highlights</strong> (not leftover
          previews). Each clip is a thumbnail and title — tap{" "}
          <strong>Watch on YouTube</strong> to open it in the YouTube app or
          your browser (NFL blocks in-app playback). After watching, switch
          back to Survive Sunday — we don’t jump you back automatically.
        </p>
      </div>
      <WeekSwitcher
        weeks={props.weekOptions}
        selectedWeek={props.selectedWeek}
        currentWeek={props.focusWeek}
        basePath="/videos"
        allowFuture
      />
      <WeeklyVideosPanel week={props.selectedWeek} />
    </div>
  );
}
