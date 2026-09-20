/**
 * Header Share: current page URL (Web Share or copy + “Link copied”).
 *
 *   npx tsx scripts/verify-header-share.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PAGE_SHARE_COPIED,
  PAGE_SHARE_FAILED,
  PAGE_SHARE_TITLE,
  canUseWebShare,
  copyText,
  pageShareTitle,
  shareCurrentPage,
  shouldShowHeaderShare,
} from "../src/lib/page-share";

function src(path: string) {
  return readFileSync(path, "utf8");
}

function lineCount(path: string) {
  return src(path).split("\n").length;
}

assert.equal(shouldShowHeaderShare("/pick"), true);
assert.equal(shouldShowHeaderShare("/pick?week=2"), true);
assert.equal(shouldShowHeaderShare("/team/kc/schedule"), true);
assert.equal(shouldShowHeaderShare("/scores"), true);
assert.equal(shouldShowHeaderShare("/standings"), true);
assert.equal(shouldShowHeaderShare("/admin"), false);
assert.equal(shouldShowHeaderShare("/admin/users"), false);
assert.equal(shouldShowHeaderShare("/account"), false);
assert.equal(shouldShowHeaderShare("/account/notifications"), false);
assert.equal(shouldShowHeaderShare("/login"), false);
assert.equal(shouldShowHeaderShare("/login/forgot"), false);
assert.equal(shouldShowHeaderShare("/join"), false);
assert.equal(shouldShowHeaderShare("/join?who=gams"), false);
assert.equal(PAGE_SHARE_COPIED, "Link copied");
assert.equal(PAGE_SHARE_FAILED, "Couldn’t copy — try again");

assert.equal(pageShareTitle("/pick"), "Survive Sunday — My pick");
assert.equal(pageShareTitle("/team/kc/schedule"), "Survive Sunday — KC schedule");
assert.equal(pageShareTitle("/team/sf"), "Survive Sunday — SF");
assert.equal(pageShareTitle("/scores?week=2"), "Survive Sunday — Scores");
assert.equal(pageShareTitle("/standings"), "Survive Sunday — Leaderboard");
assert.equal(pageShareTitle("/nfl"), "Survive Sunday — Standings");
assert.equal(pageShareTitle("/unknown"), PAGE_SHARE_TITLE);

async function main() {
  const nav = globalThis.navigator;
  const shared: ShareData[] = [];
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      share: async (data: ShareData) => {
        shared.push(data);
      },
      canShare: () => true,
    },
  });
  assert.equal(canUseWebShare({ url: "https://example.com/pick" }), true);
  assert.equal(
    await shareCurrentPage({
      url: "https://example.com/team/kc/schedule",
      title: "Survive Sunday — KC schedule",
    }),
    "shared"
  );
  assert.equal(shared[0]?.url, "https://example.com/team/kc/schedule");
  assert.match(String(shared[0]?.title), /Survive Sunday/);

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      share: async () => {
        const err = new Error("Share canceled");
        err.name = "AbortError";
        throw err;
      },
      canShare: () => true,
    },
  });
  assert.equal(
    await shareCurrentPage({ url: "https://example.com/pick", title: "x" }),
    "cancelled"
  );

  let copied = "";
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text: string) => {
          copied = text;
        },
      },
    },
  });
  assert.equal(canUseWebShare({ url: "https://example.com/pick" }), false);
  assert.equal(
    await shareCurrentPage({
      url: "https://example.com/scores?week=2",
      title: "Survive Sunday — Scores",
    }),
    "copied"
  );
  assert.equal(copied, "https://example.com/scores?week=2");
  assert.equal(await copyText("hello"), true);

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: nav,
  });
}

const files = [
  "src/lib/page-share.ts",
  "src/components/HeaderShareButton.tsx",
  "src/components/AppHeader.tsx",
  "src/components/HeaderHelpLink.tsx",
];
for (const file of files) {
  const n = lineCount(file);
  assert.ok(n <= 100, `${file} is ${n} lines (max 100)`);
}

const header = src("src/components/AppHeader.tsx");
assert.match(header, /HeaderShareButton/);
assert.match(header, /HeaderHelpLink/);
assert.match(header, /AccountMenu/);
assert.match(header, /<HeaderShareButton \/>\s*<HeaderHelpLink \/>/);

const btn = src("src/components/HeaderShareButton.tsx");
assert.match(btn, /from "lucide-react"/);
assert.match(btn, /\{ Share \}/);
assert.match(btn, /min-h-11 min-w-11/);
assert.match(btn, /data-testid="header-share"/);
assert.match(btn, /PAGE_SHARE_COPIED/);
assert.match(btn, /window\.location\.href/);
assert.match(btn, /shouldShowHeaderShare/);
assert.doesNotMatch(btn, /Share2/);

const help = src("src/components/features/help/HelpScreens.tsx");
assert.match(help, /Header Share sends a link/);
assert.match(help, /hidden on Admin and Settings/);
assert.match(help, /press and hold the page title/);

const login = src("src/app/login/page.tsx");
assert.doesNotMatch(login, /HeaderShareButton|AppHeader/);
const join = src("src/app/join/page.tsx");
assert.doesNotMatch(join, /HeaderShareButton|AppHeader/);

void main()
  .then(() => {
    console.log("verify-header-share: ok");
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
