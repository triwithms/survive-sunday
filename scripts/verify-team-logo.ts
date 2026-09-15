/**
 * Official ESPN team-mark URLs (no network).
 *
 *   npx tsx scripts/verify-team-logo.ts
 */
import assert from "node:assert/strict";
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
  espnTeamLogoUrl("WAS"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
);
assert.equal(
  espnTeamLogoUrl("wsh"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
);
assert.equal(
  espnTeamLogoUrl("JAC"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png"
);
assert.equal(teamLogoUrl("GB", null), espnTeamLogoUrl("GB"));
assert.equal(teamLogoUrl("LAR", "  "), espnTeamLogoUrl("LAR"));

for (const abbr of Object.keys(ESPN_TEAM_IDS)) {
  const url = espnTeamLogoUrl(abbr);
  assert.match(
    url,
    /^https:\/\/a\.espncdn\.com\/i\/teamlogos\/nfl\/500\/[a-z]{2,3}\.png$/
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

console.log("verify-team-logo: ok");
