import { LiveScoresRefresh } from "@/components/LiveScoresRefresh";
import { ShareExport } from "@/components/ShareExport";
import type { ScoresHeadingProps } from "./screen-types";

export function ScoresHeading(
  props: ScoresHeadingProps & { poll: boolean }
) {
  return (
    <div
      className="space-y-1"
      data-share-chunk=""
      data-share-section="heading"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <ShareExport
          surface="scores"
          rootId="share-scores"
          weekLabel={props.weekLabel}
          titleRest=" scores"
          gameCount={props.gameCount}
          liveGameCount={props.liveCount}
          pickRowCount={props.pickRowCount}
        />
        <div className="shrink-0" data-share-chrome="">
          <LiveScoresRefresh
            weekNumber={props.weekNumber}
            poll={props.poll}
            showRefresh
          />
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)] mt-1">
        Live scores from ESPN. Team logos sit beside the abbreviations.
        Logos open team pages. Finals auto-grade picks.
      </p>
      <p className="text-sm text-[var(--text-muted)] mt-1" data-share-chrome="">
        Tap Details on a game for more, including a YouTube preview
        (before kickoff) or highlights (after the game) as a thumbnail
        you open on YouTube.
      </p>
      {props.liveCount > 0 ? (
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {props.liveCount} live now
        </p>
      ) : null}
      {props.espnSyncError ? (
        <p className="text-xs text-crimson-400 mt-1">{props.espnSyncError}</p>
      ) : null}
    </div>
  );
}
