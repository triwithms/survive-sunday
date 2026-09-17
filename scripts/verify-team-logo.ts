/**
 * Official ESPN team-mark URLs (abbr slug, not numeric ids).
 *
 *   npx tsx scripts/verify-team-logo.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  ESPN_TEAM_IDS,
  espnTeamLogoUrl,
  teamLogoUrl,
} from "../src/lib/espn-teams";
import { TEAM_LOGO_SIZE } from "../src/lib/team-logo-size";

assert.equal(
  espnTeamLogoUrl("BUF"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png"
);
assert.equal(
  espnTeamLogoUrl("DET"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/det.png"
);
assert.equal(
  espnTeamLogoUrl("KC"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"
);
assert.equal(
  espnTeamLogoUrl("ATL"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png"
);
assert.equal(
  espnTeamLogoUrl("CAR"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/car.png"
);
assert.notEqual(
  espnTeamLogoUrl("CAR"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/29.png"
);
assert.equal(
  espnTeamLogoUrl("WAS"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
);
assert.equal(
  espnTeamLogoUrl("wsh"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
);
assert.equal(
  teamLogoUrl("KC", "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"
);
assert.equal(teamLogoUrl("GB", null), espnTeamLogoUrl("GB"));
assert.equal(teamLogoUrl("LAR", "  "), espnTeamLogoUrl("LAR"));
assert.equal(teamLogoUrl("NYJ"), espnTeamLogoUrl("NYJ"));

for (const abbr of Object.keys(ESPN_TEAM_IDS)) {
  const url = espnTeamLogoUrl(abbr);
  assert.match(
    url,
    /^https:\/\/a\.espncdn\.com\/i\/teamlogos\/nfl\/500\/[a-z]{2,3}\.png$/,
    `${abbr} logo url`
  );
}

assert.equal(TEAM_LOGO_SIZE.compact, 44);
assert.equal(TEAM_LOGO_SIZE.row, 48);
assert.equal(TEAM_LOGO_SIZE.slate, 66);
assert.equal(TEAM_LOGO_SIZE.featured, 84);
assert.equal(TEAM_LOGO_SIZE.hero, 96);

const teamLogoSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/TeamLogo.tsx"),
  "utf8"
);
assert.match(teamLogoSrc, /<img/);
assert.equal(teamLogoSrc.includes("opacity-0"), false);
assert.equal(teamLogoSrc.includes("teamBadge"), false);
assert.equal(teamLogoSrc.includes("TEAM_BADGES"), false);
assert.equal(teamLogoSrc.includes("29.png"), false);

const poolSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/features/home/HomePickHero.tsx"),
  "utf8"
);
assert.match(poolSrc, /TeamLogo/);
assert.match(poolSrc, /TEAM_LOGO_SIZE\.hero/);
assert.equal(poolSrc.includes("TEAM_LOGO_SIZE.compact"), false);
assert.equal(poolSrc.includes("TEAM_LOGO_SIZE.row"), false);

const scheduleSrc = fs.readFileSync(
  path.join(process.cwd(), "src/app/(app)/schedule/page.tsx"),
  "utf8"
);
assert.match(scheduleSrc, /<TeamLogo/);
assert.match(scheduleSrc, /TEAM_LOGO_SIZE\.compact/);
assert.match(scheduleSrc, /logoByAbbr/);

function httpStatus(url: string): string {
  const result = spawnSync(
    "curl",
    ["-s", "-o", "/dev/null", "-w", "%{http_code}", "-L", url],
    { encoding: "utf8" }
  );
  assert.equal(result.status, 0, `curl ${url}`);
  return result.stdout.trim();
}

const SPOT: Array<[string, string]> = [
  ["ATL", espnTeamLogoUrl("ATL")],
  ["BUF", espnTeamLogoUrl("BUF")],
  ["CAR", espnTeamLogoUrl("CAR")],
  ["DET", espnTeamLogoUrl("DET")],
  ["KC", espnTeamLogoUrl("KC")],
];
const hashes = new Set<string>();
for (const [abbr, url] of SPOT) {
  assert.equal(httpStatus(url), "200", `${abbr} HEAD 200`);
  const body = spawnSync("curl", ["-sL", url]);
  assert.equal(body.status, 0, `curl body ${abbr}`);
  const bytes = Buffer.from(body.stdout);
  assert.ok(bytes.length > 1000, `${abbr} image has bytes`);
  hashes.add(createHash("sha256").update(bytes).digest("hex"));
}
assert.equal(hashes.size, SPOT.length, "spot-check logos are distinct files");

console.log("verify-team-logo: ok");
