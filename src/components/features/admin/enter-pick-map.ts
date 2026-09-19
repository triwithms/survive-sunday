import { MISSED_TEAM, isWeekLocked, parseUsedTeams } from "@/lib/grading";
import { allowedEnterPickWeeks, type EnterPickWeekBits } from "@/lib/enter-pick-week";
import type { EnterPickMember, EnterPickTeam } from "./enter-pick-types";

type WeekRow = {
  number: number;
  lockAt: Date;
  lockOverrideAt: Date | null;
  games: Array<{
    id: string;
    awayAbbr: string;
    homeAbbr: string;
    status: string;
    kickoff: Date;
  }>;
};

type MemberRow = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  playingFromWeek: number | null;
  usedTeamsJson: string;
  picks: Array<{
    teamAbbr: string;
    source: string;
    gameId: string | null;
    week: { number: number };
  }>;
};

export function weekTeamOptions(
  games: { awayAbbr: string; homeAbbr: string }[],
  names: Map<string, string>
): EnterPickTeam[] {
  const rows: EnterPickTeam[] = [];
  for (const g of games) {
    const away = names.get(g.awayAbbr) ?? g.awayAbbr;
    const home = names.get(g.homeAbbr) ?? g.homeAbbr;
    rows.push({ abbr: g.awayAbbr, name: `${g.awayAbbr} ${away} @ ${g.homeAbbr}` });
    rows.push({ abbr: g.homeAbbr, name: `${g.homeAbbr} ${home} vs ${g.awayAbbr}` });
  }
  return rows.sort((a, b) => a.abbr.localeCompare(b.abbr));
}

export function weekBits(weeks: WeekRow[]): EnterPickWeekBits[] {
  return weeks.map((w) => ({
    number: w.number,
    locked: isWeekLocked(w),
    games: w.games,
  }));
}

export function toEnterPickMember(
  m: MemberRow,
  currentWeek: number,
  bits: EnterPickWeekBits[]
): EnterPickMember {
  const picks = m.picks
    .filter((p) => p.source !== "missed" && p.teamAbbr !== MISSED_TEAM)
    .map((p) => ({
      weekNumber: p.week.number,
      teamAbbr: p.teamAbbr,
      source: p.source,
      gameId: p.gameId,
    }));
  return {
    id: m.id,
    nickname: m.nickname,
    realName: m.realName,
    status: m.status,
    usedTeams: parseUsedTeams(m.usedTeamsJson).filter((t) => t !== MISSED_TEAM),
    picks: picks.map((p) => ({ weekNumber: p.weekNumber, teamAbbr: p.teamAbbr })),
    allowedWeeks: allowedEnterPickWeeks({
      currentWeek,
      weeks: bits,
      member: { playingFromWeek: m.playingFromWeek, picks },
    }),
  };
}
