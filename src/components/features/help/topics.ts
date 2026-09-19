import type { ComponentType } from "react";
import { HelpAccount } from "./HelpAccount";
import { HelpForAdmins } from "./HelpForAdmins";
import { HelpInstall } from "./HelpInstall";
import { HelpPick } from "./HelpPick";
import { HelpRules } from "./HelpRules";
import { HelpScreens } from "./HelpScreens";
import { HelpSignIn } from "./HelpSignIn";

export type HelpTopic = {
  hash: string;
  aliases: string[];
  title: string;
  Component: ComponentType;
};

/** Menu order. Hashes + aliases keep /help#install, /help#account, etc. */
export const HELP_TOPICS: HelpTopic[] = [
  {
    hash: "install",
    aliases: ["install-home-screen"],
    title: "Install on Home Screen",
    Component: HelpInstall,
  },
  {
    hash: "sign-in",
    aliases: ["how-to-sign-in"],
    title: "How to sign in",
    Component: HelpSignIn,
  },
  {
    hash: "pick",
    aliases: ["making-a-pick"],
    title: "Making / changing a pick",
    Component: HelpPick,
  },
  {
    hash: "tabs",
    aliases: ["the-tabs", "share-board-scores"],
    title: "The tabs (My pick · Selections · Leaderboard · Scores · Schedule · Standings)",
    Component: HelpScreens,
  },
  {
    hash: "rules",
    aliases: [],
    title: "Rules",
    Component: HelpRules,
  },
  {
    hash: "account",
    aliases: [],
    title: "Account / password reset",
    Component: HelpAccount,
  },
  {
    hash: "administrators",
    aliases: ["for-administrators"],
    title: "For Administrators",
    Component: HelpForAdmins,
  },
];

export function topicForHash(raw: string): HelpTopic | undefined {
  const hash = raw.trim().toLowerCase();
  if (!hash) return undefined;
  return HELP_TOPICS.find(
    (topic) => topic.hash === hash || topic.aliases.includes(hash),
  );
}
