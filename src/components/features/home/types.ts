import type { InjuryCountBits } from "@/lib/game-display";
import type { WeekNavOption } from "@/lib/weeks";
import type { StatusBadgeStatus } from "@/components/ui";

export type HomePickBits = {
  teamAbbr: string;
  result: string | null;
  source: string | null;
  game: { awayAbbr: string; homeAbbr: string } | null;
};

export type HomeRow = {
  id: string;
  nickname: string;
  realName: string | null;
  status: string;
  autoPickStamps: number | null;
  pick: HomePickBits | null;
  missed: boolean;
  missedResult: string | null;
};

export type HomeGame = {
  id: string;
  awayAbbr: string;
  homeAbbr: string;
  status: string;
  kickoff: Date;
  scoreAway: number | null;
  scoreHome: number | null;
  note: string | null;
};

export type HomeHeroProps = {
  teamAbbr: string;
  logoUrl: string | null;
  priorStanding: string | null;
  gameLine: string | null;
  injuryCounts: InjuryCountBits | null;
  favouriteLabel: string | null;
  imported: boolean;
  status: StatusBadgeStatus;
  result: string | null;
  actionHref: string | null;
  actionLabel: string | null;
};

export type HomeEmptyPickProps = {
  eliminated: boolean;
  spectator: boolean;
  locked: boolean;
  isCurrentWeek: boolean;
  emptyPick: {
    message: string;
    ctaLabel: string | null;
    href: string | null;
    missed: boolean;
  };
};

export type HomeScreenProps = {
  weekLabel: string;
  lockAt: Date;
  revealAllPicks: boolean;
  weekOptions: WeekNavOption[];
  selectedWeek: number;
  focusWeek: number;
  poll: boolean;
  hero: HomeHeroProps | null;
  empty: HomeEmptyPickProps | null;
  games: HomeGame[];
  rows: HomeRow[];
  selfId: string;
};
