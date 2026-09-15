/** Client-safe score / clock helpers for pool, scores, pick, schedule. */

import { abbrFromEspnTeamId, normAbbr } from "@/lib/espn-teams";

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

export type EspnNoteParts = {
  clock: string | null;
  situation: string | null;
};

/** Split Game.note into clock + optional live situation (possession / down / spot). */
export function splitEspnGameNote(
  note: string | null | undefined
): EspnNoteParts {
  if (!note) return { clock: null, situation: null };
  const cleaned = note.replace(ESPN_NOTE_SOURCE, "").trim();
  if (!cleaned) return { clock: null, situation: null };
  const parts = cleaned.split(/\s*·\s*/).filter(Boolean);
  const first = parts[0] ?? "";
  const rest = parts.slice(1).join(" · ") || null;
  if (/^live$/i.test(first)) return { clock: null, situation: rest };
  if (/^final$/i.test(first)) return { clock: null, situation: rest };
  return { clock: first, situation: rest };
}

/**
 * Period / clock / shortDetail already stored on Game.note by ESPN sync.
 * Does not invent a clock. Returns null when the feed only said Live or Final.
 */
export function espnClockFromNote(note: string | null | undefined): string | null {
  return splitEspnGameNote(note).clock;
}

/** Live situation already stored on Game.note (possession / down / yard line). */
export function espnSituationFromNote(
  note: string | null | undefined
): string | null {
  return splitEspnGameNote(note).situation;
}

export type EspnSituationBits = {
  possession?: string | null;
  shortDownDistanceText?: string | null;
  possessionText?: string | null;
  downDistanceText?: string | null;
  down?: number | null;
  distance?: number | null;
};

function possessionAbbr(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const fromId = abbrFromEspnTeamId(raw);
  if (fromId) return fromId;
  if (/^[A-Za-z]{2,3}$/.test(raw.trim())) return normAbbr(raw);
  return null;
}

function downAndDistance(sit: EspnSituationBits): string | null {
  const short = sit.shortDownDistanceText?.trim();
  if (short) return short;
  if (sit.down != null && sit.down >= 1 && sit.distance != null && sit.distance >= 0) {
    const ord =
      sit.down === 1
        ? "1st"
        : sit.down === 2
          ? "2nd"
          : sit.down === 3
            ? "3rd"
            : sit.down === 4
              ? "4th"
              : `${sit.down}th`;
    return `${ord} & ${sit.distance}`;
  }
  return null;
}

/**
 * Plain-English live situation from ESPN scoreboard fields.
 * Does not invent a down or spot — omits missing pieces.
 */
export function formatEspnSituation(
  sit: EspnSituationBits | null | undefined
): string | null {
  if (!sit) return null;
  const ball = possessionAbbr(sit.possession);
  const down = downAndDistance(sit);
  const spot = sit.possessionText?.trim().replace(/\bWSH\b/gi, "WAS") || null;
  const parts: string[] = [];
  if (ball) parts.push(`${ball} ball`);
  if (down) parts.push(down);
  if (spot) parts.push(spot);
  if (parts.length) return parts.join(" · ");
  const fallback = sit.downDistanceText?.trim().replace(/\bWSH\b/gi, "WAS");
  return fallback || null;
}

/** Team with the ball from a stored situation line ("KC ball · …"). */
export function possessionAbbrFromSituation(
  situation: string | null | undefined
): string | null {
  const m = situation?.match(/^([A-Za-z]{2,3})\s+ball\b/i);
  if (!m) return null;
  return normAbbr(m[1]);
}

function quarterOrdinal(n: number): string {
  if (n === 1) return "1ST";
  if (n === 2) return "2ND";
  if (n === 3) return "3RD";
  if (n === 4) return "4TH";
  return `${n}TH`;
}

/** TV-style period from a stored clock ("Q4 9:00" → 4TH, 9:00). */
export function formatScorebugPeriod(
  clock: string | null | undefined
): { period: string; time: string | null } | null {
  if (!clock) return null;
  const q = clock.match(/^Q([1-4])(?:\s+(\d{1,2}:\d{2}))?$/i);
  if (q) {
    return { period: quarterOrdinal(Number(q[1])), time: q[2] ?? null };
  }
  const ot = clock.match(/^OT\d*(?:\s+(\d{1,2}:\d{2}))?$/i);
  if (ot) return { period: "OT", time: ot[1] ?? null };
  if (/half/i.test(clock)) return { period: "HALF", time: null };
  const end = clock.match(/^End of (\d+)(?:st|nd|rd|th)$/i);
  if (end) return { period: `END ${quarterOrdinal(Number(end[1]))}`, time: null };
  return { period: clock.toUpperCase(), time: null };
}

export function formatScorebugPeriodLine(
  clock: string | null | undefined
): string | null {
  const parts = formatScorebugPeriod(clock);
  if (!parts) return null;
  return parts.time ? `${parts.period} | ${parts.time}` : parts.period;
}

export type SituationParts = {
  possession: string | null;
  down: string | null;
  spot: string | null;
};

/** Split a stored situation line into possession / down / spot. */
export function parseSituationParts(
  situation: string | null | undefined
): SituationParts {
  if (!situation) return { possession: null, down: null, spot: null };
  let possession: string | null = null;
  let down: string | null = null;
  let spot: string | null = null;
  for (const part of situation.split(/\s*·\s*/).filter(Boolean)) {
    const ball = part.match(/^([A-Za-z]{2,3})\s+ball$/i);
    if (ball) {
      possession = normAbbr(ball[1]);
      continue;
    }
    if (/\d(?:st|nd|rd|th)\s*&\s*/i.test(part) || /\bgoal\b/i.test(part)) {
      down = part;
      continue;
    }
    if (/^[A-Za-z]{2,3}\s+\d{1,2}$/.test(part)) {
      spot = part.replace(/\bWSH\b/gi, "WAS");
    }
  }
  return { possession, down, spot };
}

export type LiveScorebugView = {
  down: string | null;
  periodLine: string | null;
  spot: string | null;
  possession: string | null;
};

/** Scorebug strip from stored ESPN note — no invented down or clock. */
export function formatLiveScorebug(
  note: string | null | undefined
): LiveScorebugView {
  const { clock, situation } = splitEspnGameNote(note);
  const sit = parseSituationParts(situation);
  return {
    down: sit.down ? sit.down.toUpperCase() : null,
    periodLine: formatScorebugPeriodLine(clock),
    spot: sit.spot,
    possession: sit.possession,
  };
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
  /** Possession / down / yard line for live games. */
  situation: string | null;
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
      situation: espnSituationFromNote(game.note),
    };
  }
  if (isFinalGame(game.status)) {
    const extra = espnClockFromNote(game.note);
    if (extra && /^final/i.test(extra)) {
      return { kind: "final", primary: extra, secondary: null, situation: null };
    }
    return { kind: "final", primary: "Final", secondary: extra, situation: null };
  }
  const kick = formatKickoffForScores(game.kickoff, now);
  return {
    kind: "scheduled",
    primary: kick || "Scheduled",
    secondary: game.network?.trim() || null,
    situation: null,
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
    const clock = espnClockFromNote(game.note);
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

/**
 * Schedule / Pick list line: kickoff (caller) or LIVE/Final score.
 * No TV network, quarter, clock, or down-distance — those stay on Scores.
 */
export function formatMatchupListLine(game: GameScoreBits): string | null {
  const live = isLiveGame(game.status);
  const final = isFinalGame(game.status);
  if (!live && !final) return null;
  const scored =
    game.scoreAway != null && game.scoreHome != null
      ? `${game.scoreAway}–${game.scoreHome}`
      : null;
  if (live) return scored ? `LIVE ${scored}` : "LIVE";
  return scored ? `Final ${scored}` : "Final";
}

export type InjuryCountBits = {
  out: number;
  doubtful: number;
  questionable: number;
};

/** Compact chip: "2 Out · 1 Q". Used on team pages and Home. Not on Schedule/Pick lists. */
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
