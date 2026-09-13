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

/** NFL slate display timezone (US ET), matching Help / HANDOFF. */
export const NFL_DISPLAY_TZ = "America/New_York";

const ESPN_NOTE_SOURCE = /\s*·\s*ESPN\s*$/i;

/**
 * Period / clock / shortDetail already stored on Game.note by ESPN sync.
 * Does not invent a clock. Returns null when the feed only said Live or Final.
 */
export function espnClockFromNote(note: string | null | undefined): string | null {
  if (!note) return null;
  const cleaned = note.replace(ESPN_NOTE_SOURCE, "").trim();
  if (!cleaned) return null;
  if (/^live$/i.test(cleaned)) return null;
  if (/^final$/i.test(cleaned)) return null;
  return cleaned;
}

/** Compact kickoff: "Today 1:00 p.m. ET" or "Mon 8:15 p.m. ET". */
export function formatKickoffForScores(
  kickoff: Date | string | null | undefined,
  now: Date | number = Date.now()
): string {
  if (kickoff == null) return "";
  const date = typeof kickoff === "string" ? new Date(kickoff) : kickoff;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const nowDate = now instanceof Date ? now : new Date(now);

  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: NFL_DISPLAY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: NFL_DISPLAY_TZ,
    hour: "numeric",
    minute: "2-digit",
  });
  const weekdayFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: NFL_DISPLAY_TZ,
    weekday: "short",
  });

  const time = `${timeFmt.format(date)} ET`;
  if (dayKey.format(date) === dayKey.format(nowDate)) {
    return `Today ${time}`;
  }
  return `${weekdayFmt.format(date)} ${time}`;
}

export type ScoresStatusBits = GameScoreBits & {
  kickoff?: Date | string | null;
  network?: string | null;
};

export type ScoresStatusView = {
  kind: "live" | "final" | "scheduled";
  /** Clock, Final, or kickoff — shown next to the score. */
  primary: string;
  /** LIVE, network, or extra ESPN detail. */
  secondary: string | null;
};

/** Phone-friendly Scores status from stored ESPN note + kickoff (no fake clock). */
export function formatScoresStatus(
  game: ScoresStatusBits,
  now: Date | number = Date.now()
): ScoresStatusView {
  if (isLiveGame(game.status)) {
    const clock = espnClockFromNote(game.note);
    return {
      kind: "live",
      primary: clock || "LIVE",
      secondary: clock ? "LIVE" : null,
    };
  }
  if (isFinalGame(game.status)) {
    const extra = espnClockFromNote(game.note);
    if (extra && /^final/i.test(extra)) {
      return { kind: "final", primary: extra, secondary: null };
    }
    return { kind: "final", primary: "Final", secondary: extra };
  }
  const kick = formatKickoffForScores(game.kickoff, now);
  return {
    kind: "scheduled",
    primary: kick || "Scheduled",
    secondary: game.network?.trim() || null,
  };
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
