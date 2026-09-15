/**
 * Team logo URL helper (no network).
 *
 *   npx tsx scripts/verify-team-logo.ts
 */
import assert from "node:assert/strict";
import {
  ESPN_TEAM_IDS,
  espnTeamLogoUrl,
  lookupStoredLogo,
  teamLogoUrl,
} from "../src/lib/espn-teams";
import { TEAM_LOGO_SIZE } from "../src/lib/team-logo-size";

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

assert.equal(TEAM_LOGO_SIZE.compact, 44);
assert.equal(TEAM_LOGO_SIZE.row, 48);
assert.equal(TEAM_LOGO_SIZE.slate, 66);
assert.equal(TEAM_LOGO_SIZE.featured, 84);
assert.equal(TEAM_LOGO_SIZE.hero, 96);

const ALIASES: Array<[string, string]> = [
  ["WSH", "WAS"],
  ["WFT", "WAS"],
  ["JAC", "JAX"],
  ["LA", "LAR"],
  ["STL", "LAR"],
  ["SD", "LAC"],
  ["OAK", "LV"],
  ["LVR", "LV"],
  ["GNB", "GB"],
  ["KAN", "KC"],
  ["NWE", "NE"],
  ["NOR", "NO"],
  ["SFO", "SF"],
  ["TAM", "TB"],
];

const logos = new Set<string>();
for (const abbr of Object.keys(ESPN_TEAM_IDS)) {
  const url = espnTeamLogoUrl(abbr);
  assert.match(
    url,
    /^https:\/\/a\.espncdn\.com\/i\/teamlogos\/nfl\/500\/[a-z]{2,3}\.png$/,
    `${abbr} logo url`
  );
  assert.notEqual(url, "https://a.espncdn.com/i/teamlogos/nfl/500/.png");
  assert.equal(teamLogoUrl(abbr, null), url);
  assert.equal(teamLogoUrl(abbr.toLowerCase(), "  "), url);
  logos.add(url);
}
assert.equal(logos.size, 32, "32 distinct ESPN logo URLs");

for (const [alias, canonical] of ALIASES) {
  assert.equal(
    espnTeamLogoUrl(alias),
    espnTeamLogoUrl(canonical),
    `${alias} → ${canonical} logo`
  );
  assert.equal(teamLogoUrl(alias, null), espnTeamLogoUrl(canonical));
}

const stored = new Map<string, string | null>([
  ["WAS", "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"],
  ["JAX", "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png"],
]);
assert.equal(
  lookupStoredLogo(stored, "WFT"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png"
);
assert.equal(
  lookupStoredLogo(stored, "JAC"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png"
);
assert.equal(lookupStoredLogo(stored, "KC"), null);
assert.equal(
  teamLogoUrl("WFT", lookupStoredLogo(stored, "WFT")),
  espnTeamLogoUrl("WAS")
);

console.log("verify-team-logo: ok");
