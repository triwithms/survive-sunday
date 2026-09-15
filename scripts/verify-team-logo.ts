/**
 * Official ESPN team-mark URLs. CAR also HEAD-checks the CDN.
 *
 *   npx tsx scripts/verify-team-logo.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  ESPN_TEAM_IDS,
  espnTeamLogoUrl,
  teamLogoUrl,
} from "../src/lib/espn-teams";
import { TEAM_LOGO_SIZE } from "../src/lib/team-logo-size";

const CAR_ESPN =
  "https://a.espncdn.com/i/teamlogos/nfl/500/29.png";
const CAR_BLANK =
  "https://a.espncdn.com/i/teamlogos/nfl/500/car.png";

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
  espnTeamLogoUrl("WAS"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
);
assert.equal(
  espnTeamLogoUrl("wsh"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
);
assert.equal(espnTeamLogoUrl("CAR"), CAR_ESPN);
assert.equal(espnTeamLogoUrl("carolina"), CAR_ESPN);
assert.equal(espnTeamLogoUrl("car"), CAR_ESPN);
assert.notEqual(espnTeamLogoUrl("CAR"), CAR_BLANK);
assert.equal(teamLogoUrl("CAR", null), CAR_ESPN);
assert.equal(teamLogoUrl("CAR", CAR_BLANK), CAR_ESPN);
assert.equal(teamLogoUrl("CAR", "https://a.espncdn.com/i/teamlogos/nfl/500/carolina.png"), CAR_ESPN);
assert.equal(
  espnTeamLogoUrl("JAC"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png"
);
assert.equal(teamLogoUrl("GB", null), espnTeamLogoUrl("GB"));
assert.equal(teamLogoUrl("LAR", "  "), espnTeamLogoUrl("LAR"));

for (const abbr of Object.keys(ESPN_TEAM_IDS)) {
  const url = espnTeamLogoUrl(abbr);
  if (abbr === "CAR") {
    assert.equal(url, CAR_ESPN);
    continue;
  }
  assert.match(
    url,
    /^https:\/\/a\.espncdn\.com\/i\/teamlogos\/nfl\/500\/[a-z]{2,3}\.png$/
  );
}

const carHead = spawnSync(
  "curl",
  ["-s", "-o", "/dev/null", "-w", "%{http_code}", "-L", CAR_ESPN],
  { encoding: "utf8" }
);
assert.equal(carHead.status, 0, "curl CAR logo");
assert.equal(carHead.stdout.trim(), "200", "CAR ESPN logo URL returns 200");

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

console.log("verify-team-logo: ok");
