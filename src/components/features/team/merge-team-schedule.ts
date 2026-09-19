import {
  byeScheduleItem,
  overlayScheduleSnap,
  snapClock,
  toScheduleItem,
} from "./schedule-item";
import type {
  TeamScheduleFileGame,
  TeamScheduleGameIn,
  TeamScheduleItem,
  TeamScheduleSnap,
} from "./team-schedule";

function fromFile(abbr: string, game: TeamScheduleFileGame): TeamScheduleGameIn {
  return {
    id: `file-w${game.week}-${abbr}`,
    week: game.week,
    awayAbbr: game.awayAbbr,
    homeAbbr: game.homeAbbr,
    kickoff: game.kickoff,
    status: "scheduled",
    scoreAway: null,
    scoreHome: null,
  };
}

function rowForWeek(
  abbr: string,
  week: number,
  db: TeamScheduleGameIn | undefined,
  file: TeamScheduleFileGame | undefined,
  snaps?: TeamScheduleSnap[],
  includeBye = false
): TeamScheduleItem | null {
  const src = db ?? (file ? fromFile(abbr, file) : null);
  if (!src) return includeBye ? byeScheduleItem(week) : null;
  const over = overlayScheduleSnap(src, snaps);
  return toScheduleItem(abbr, over, snapClock(over, snaps));
}

export function mergeTeamSchedule(
  abbr: string,
  dbGames: TeamScheduleGameIn[],
  fileGames: TeamScheduleFileGame[] | null,
  cacheByWeek?: Map<number, TeamScheduleSnap[]>
): TeamScheduleItem[] {
  const dbByWeek = new Map(dbGames.map((g) => [g.week, g]));
  const fileByWeek = new Map((fileGames ?? []).map((g) => [g.week, g]));
  const last = fileGames
    ? 18
    : Math.max(0, ...dbByWeek.keys(), ...fileByWeek.keys());
  const rows: TeamScheduleItem[] = [];
  for (let week = 1; week <= last; week++) {
    const row = rowForWeek(
      abbr,
      week,
      dbByWeek.get(week),
      fileByWeek.get(week),
      cacheByWeek?.get(week),
      Boolean(fileGames)
    );
    if (row) rows.push(row);
  }
  return rows;
}
