import type { TouchdownClip } from "./week-wrap-touchdown";
import type { WeekWrapBlocks, WeekWrapFacts } from "./week-wrap-types";

/** One pool seat in app Leaderboard order (`sortBoard`). Current season race. */
export type WeekWrapBoardRow = {
  id: string;
  nickname: string;
  status: string;
  losses: number;
  weeksSurvived: number;
};

export type WeekWrapNflTeam = {
  abbr: string;
  wins: number;
  losses: number;
  ties: number;
};

export type WeekWrapNflDivision = {
  conference: string;
  division: string;
  teams: WeekWrapNflTeam[];
};

/** Everything the email HTML and its plain-text twin render from. */
export type WeekWrapEmailParts = {
  intro: string;
  drama: string;
  blocks: WeekWrapBlocks;
  facts: WeekWrapFacts;
  clip: TouchdownClip | null;
};
