export type EnterPickMember = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  usedTeams: string[];
  picks: { weekNumber: number; teamAbbr: string }[];
  allowedWeeks: number[];
};

export type EnterPickTeam = { abbr: string; name: string };

export type EnterPickWeek = {
  number: number;
  teams: EnterPickTeam[];
};

export type EnterPickData = {
  currentWeek: number;
  /** False when the current week is locked, graded, or past lock time. */
  currentWeekOpen?: boolean;
  members: EnterPickMember[];
  weeks: EnterPickWeek[];
};

export type EnterPickSaved = {
  nickname: string;
  teamAbbr: string;
  weekNumber: number;
};
