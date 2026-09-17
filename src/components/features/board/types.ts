export type BoardPickBits = {
  teamAbbr: string;
  result: string | null;
  logoUrl: string | null;
};

export type BoardRow = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  autoPickStamps: number | null;
  losses: number;
  weeksSurvived: number;
  mulliganRemaining: boolean;
  pick: BoardPickBits | null;
};

export type BoardCta = {
  href: string;
  label: string;
  muted?: boolean;
  title?: string;
};

export type BoardHeadingProps = {
  weekLabel: string;
  stillInCount: number;
  undefeatedCount: number;
  eliminatedCount: number;
  pickRowCount: number;
  lockLine: string;
  sortLine: string;
  cta: BoardCta | null;
};

export type BoardTiebreakProps = {
  weekLabel: string;
  soleNickname: string | null;
  sharedNicknames: string[];
  showNoOfficial: boolean;
};

export type BoardScreenProps = {
  heading: BoardHeadingProps;
  rows: BoardRow[];
  selfId: string;
  revealAllPicks: boolean;
  canChangePick: boolean;
  oneAndDone: boolean;
  tiebreak: BoardTiebreakProps;
};
