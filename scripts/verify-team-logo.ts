/**
 * Team logo URL helper (no network).
 *
 *   npx tsx scripts/verify-team-logo.ts
 */
import assert from "node:assert/strict";
import { espnTeamLogoUrl, teamLogoUrl } from "../src/lib/espn-teams";

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
  teamLogoUrl("KC", "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"
);
assert.equal(teamLogoUrl("GB", null), espnTeamLogoUrl("GB"));
assert.equal(teamLogoUrl("LAR", "  "), espnTeamLogoUrl("LAR"));
assert.equal(teamLogoUrl("NYJ"), espnTeamLogoUrl("NYJ"));

console.log("verify-team-logo: ok");
