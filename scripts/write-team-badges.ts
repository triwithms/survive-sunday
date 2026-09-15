/**
 * Writes original geometric team badges to public/team-badges/.
 *   npx tsx scripts/write-team-badges.ts
 */
import fs from "node:fs";
import path from "node:path";
import { TEAM_BADGES, teamBadgeSvg } from "../src/lib/team-badges";

const dir = path.join(process.cwd(), "public/team-badges");
fs.mkdirSync(dir, { recursive: true });
for (const abbr of Object.keys(TEAM_BADGES)) {
  const file = path.join(dir, `${abbr.toLowerCase()}.svg`);
  fs.writeFileSync(file, teamBadgeSvg(abbr) + "\n");
}
console.log(`wrote ${Object.keys(TEAM_BADGES).length} badges to public/team-badges`);
