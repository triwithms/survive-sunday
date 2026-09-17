import {
  formatLiveScorebug,
  formatScoresStatus,
  isFinalGame,
  isLiveGame,
} from "@/lib/game-display";
import type { ScoreGameCardGame } from "./types";

export function scoreGameMeta(game: ScoreGameCardGame) {
  const isLive = isLiveGame(game.status);
  const isFinal = isFinalGame(game.status);
  const awayLead =
    (isFinal &&
      game.scoreAway != null &&
      game.scoreHome != null &&
      game.scoreAway > game.scoreHome) ||
    (isLive && (game.scoreAway ?? 0) > (game.scoreHome ?? 0));
  const homeLead =
    (isFinal &&
      game.scoreAway != null &&
      game.scoreHome != null &&
      game.scoreHome > game.scoreAway) ||
    (isLive && (game.scoreHome ?? 0) > (game.scoreAway ?? 0));
  const bug = isLive ? formatLiveScorebug(game.note) : null;
  const hasBall = bug?.possession ?? null;
  const status = formatScoresStatus(game);
  const detail = bug
    ? [
        hasBall ? `${hasBall} has the ball` : null,
        bug.down,
        bug.periodLine,
        bug.spot,
      ]
        .filter(Boolean)
        .join(", ") || status.primary
    : `${status.primary}${status.secondary ? `, ${status.secondary}` : ""}`;
  return {
    awayLead,
    homeLead,
    hasBall,
    aria: `${game.awayAbbr} ${game.scoreAway ?? "–"} at ${game.homeAbbr} ${
      game.scoreHome ?? "–"
    }, ${detail}`,
  };
}
