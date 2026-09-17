export type ScoresPickRowData = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  autoPickStamps: number | null;
  isSelf: boolean;
  showPick: boolean;
  teamAbbr: string | null;
  logoUrl: string | null;
  result: string;
  noPickLabel: string;
};

export type ScoresHeadingProps = {
  weekLabel: string;
  weekNumber: number;
  gameCount: number;
  liveCount: number;
  pickRowCount: number;
  espnSyncError: string | null;
};

export type ScoresScreenProps = {
  heading: ScoresHeadingProps;
  weekOptions: Array<{ number: number; label: string; hasGames: boolean }>;
  selectedWeek: number;
  focusWeek: number;
  poll: boolean;
  games: import("./types").ScoreGameCardGame[];
  revealAllPicks: boolean;
  rows: ScoresPickRowData[];
};
