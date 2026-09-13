/** Client-safe score / clock helpers for pool, scores, pick, schedule. */

/** True when Scores/Home should keep polling ESPN (live window). */
export function shouldPollLiveScores(
  games: { status: string; kickoff: Date | string }[],
  now = Date.now()
): boolean {
  if (games.some((g) => g.status === "live")) return true;
  const hour = 60 * 60 * 1000;
  return games.some((g) => {
    if (g.status === "final") return false;
    const t = new Date(g.kickoff).getTime();
    // 30m before kickoff through 4h after (covers most games)
    return t - 30 * 60 * 1000 <= now && now <= t + 4 * hour;
  });
}

export type GameScoreBits = {
  status: string;
  scoreAway: number | null;
  scoreHome: number | null;
  note?: string | null;
};

export function isLiveGame(status: string) {
  return status === "live";
}

export function isFinalGame(status: string) {
  return status === "final";
}

/** Compact line like "LIVE 17–14 · Q3 4:21 · ESPN" or "Final 13–10". */
export function formatScoreLine(game: GameScoreBits): string | null {
  const live = isLiveGame(game.status);
  const final = isFinalGame(game.status);
  if (!live && !final) return null;
  const scored =
    game.scoreAway != null && game.scoreHome != null
      ? `${game.scoreAway}–${game.scoreHome}`
      : null;
  if (live) {
    const clock = game.note?.trim();
    if (scored && clock) return `${scored} · ${clock}`;
    if (scored) return `LIVE ${scored}`;
    return clock || "LIVE";
  }
  if (scored) {
    const extra = game.note && !/^final/i.test(game.note) ? ` · ${game.note}` : "";
    return `Final ${scored}${extra}`;
  }
  return game.note || "Final";
}

export type InjuryCountBits = {
  out: number;
  doubtful: number;
  questionable: number;
};

/** Pick-adjacent chip: "2 Out · 1 Q". Omits IR/suspension (shown on team page). */
export function formatInjuryChip(counts: InjuryCountBits): string | null {
  const parts: string[] = [];
  if (counts.out > 0) parts.push(`${counts.out} Out`);
  if (counts.doubtful > 0) parts.push(`${counts.doubtful} Doubtful`);
  if (counts.questionable > 0) {
    parts.push(
      `${counts.questionable} Q`
    );
  }
  return parts.length ? parts.join(" · ") : null;
}
