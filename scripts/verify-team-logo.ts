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
  localHelmetSrc,
  resolveTeamLogoSrc,
  TEAM_HELMET_PLACEHOLDER,
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
assert.equal(
  espnTeamLogoUrl("CHI"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png"
);
assert.notEqual(
  espnTeamLogoUrl("CHI"),
  "https://a.espncdn.com/i/teamlogos/nfl/500/3.png"
);
assert.equal(
  teamLogoUrl("CHI", "https://a.espncdn.com/i/teamlogos/nfl/500/3.png"),
  espnTeamLogoUrl("CHI")
);
assert.equal(
  teamLogoUrl("CHI", "https://a.espncdn.com/i/teamlogos/nfl/500/chicago.png"),
  espnTeamLogoUrl("CHI")
);
assert.equal(teamLogoUrl("CHI", espnTeamLogoUrl("CHI")), espnTeamLogoUrl("CHI"));

const stale = "https://example.com/stale-chi.png";
const localChi = localHelmetSrc("CHI");
assert.equal(localChi, "/helmets/chi.png");
assert.equal(localHelmetSrc("PIT"), "/helmets/pit.png");
assert.equal(localHelmetSrc("Chi"), "/helmets/chi.png");
assert.equal(localHelmetSrc("wsh"), "/helmets/was.png");
assert.equal(localHelmetSrc("WSH"), "/helmets/was.png");
assert.equal(localHelmetSrc("/helmets/PIT.png"), "/helmets/pit.png");
assert.equal(localHelmetSrc("PIT.png"), "/helmets/pit.png");
assert.equal(localHelmetSrc("PIT"), localHelmetSrc("PIT").toLowerCase());
assert.doesNotMatch(localHelmetSrc("PIT"), /[A-Z]/);
assert.doesNotMatch(localHelmetSrc("Chi"), /[A-Z]/);
assert.equal(resolveTeamLogoSrc("CHI", stale, null), localChi);
assert.equal(resolveTeamLogoSrc("CHI", stale, localChi), stale);
assert.equal(
  resolveTeamLogoSrc("CHI", stale, [localChi, stale]),
  espnTeamLogoUrl("CHI")
);
assert.equal(resolveTeamLogoSrc("CHI", null, null), localChi);
assert.equal(
  resolveTeamLogoSrc("CHI", espnTeamLogoUrl("CHI"), localChi),
  espnTeamLogoUrl("CHI")
);
assert.equal(
  resolveTeamLogoSrc("CHI", espnTeamLogoUrl("CHI"), [
    localChi,
    espnTeamLogoUrl("CHI"),
  ]),
  TEAM_HELMET_PLACEHOLDER
);
assert.equal(
  resolveTeamLogoSrc("CHI", null, [
    localChi,
    espnTeamLogoUrl("CHI"),
    TEAM_HELMET_PLACEHOLDER,
  ]),
  TEAM_HELMET_PLACEHOLDER
);
assert.notEqual(resolveTeamLogoSrc("CHI", null, "gone"), null);
assert.equal(
  resolveTeamLogoSrc("PIT", "/helmets/PIT.png", null),
  "/helmets/pit.png"
);
assert.equal(
  resolveTeamLogoSrc("PIT", "/helmets/PIT.png", "/helmets/pit.png"),
  espnTeamLogoUrl("PIT")
);
assert.equal(
  resolveTeamLogoSrc("PIT", null, [localHelmetSrc("PIT"), espnTeamLogoUrl("PIT")]),
  TEAM_HELMET_PLACEHOLDER
);

assert.equal(Object.keys(ESPN_TEAM_IDS).length, 32);
const localHashes = new Set<string>();
for (const abbr of Object.keys(ESPN_TEAM_IDS)) {
  const url = espnTeamLogoUrl(abbr);
  assert.match(
    url,
    /^https:\/\/a\.espncdn\.com\/i\/teamlogos\/nfl\/500\/[a-z]{2,3}\.png$/,
    `${abbr} logo url`
  );
  const local = localHelmetSrc(abbr);
  assert.equal(local, `/helmets/${abbr.toLowerCase()}.png`, `${abbr} local path`);
  assert.equal(local, localHelmetSrc(abbr.toLowerCase()));
  assert.equal(local, local.toLowerCase(), `${abbr} path is lowercase`);
  assert.doesNotMatch(local, /[A-Z]/, `${abbr} never uppercase path`);
  assert.match(local, /^\/helmets\/[a-z]{2,3}\.png$/, `${abbr} helmet slug`);
  const file = path.join(
    process.cwd(),
    "public/helmets",
    `${abbr.toLowerCase()}.png`
  );
  assert.equal(fs.existsSync(file), true, `${abbr} local helmet`);
  const bytes = fs.readFileSync(file);
  assert.ok(bytes.length > 1000, `${abbr} local helmet has bytes`);
  assert.equal(bytes[0], 0x89, `${abbr} is PNG`);
  localHashes.add(createHash("sha256").update(bytes).digest("hex"));
}
assert.equal(localHashes.size, 32, "32 distinct local helmets");
assert.equal(
  fs.existsSync(path.join(process.cwd(), "public/helmets/_placeholder.svg")),
  true,
  "neutral placeholder helmet"
);
assert.equal(TEAM_HELMET_PLACEHOLDER, "/helmets/_placeholder.svg");

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
assert.match(teamLogoSrc, /resolveTeamLogoSrc/);
assert.match(teamLogoSrc, /object-contain/);
assert.match(teamLogoSrc, /bg-stadium-800/);
assert.equal(teamLogoSrc.includes("bg-white"), false);
assert.equal(teamLogoSrc.includes("opacity-0"), false);
assert.equal(teamLogoSrc.includes("teamBadge"), false);
assert.equal(teamLogoSrc.includes("TEAM_BADGES"), false);
assert.equal(teamLogoSrc.includes("29.png"), false);
assert.equal(teamLogoSrc.includes("abbr.slice"), false);
assert.equal(teamLogoSrc.includes("letter"), false);
assert.match(teamLogoSrc, /setFailed/);
assert.ok(teamLogoSrc.split("\n").length <= 100, "TeamLogo stays small");

const scoreTeamRowSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/features/scores/ScoreTeamRow.tsx"),
  "utf8"
);
assert.match(scoreTeamRowSrc, /<TeamLogo/);
assert.equal(scoreTeamRowSrc.includes("/helmets/"), false);
assert.equal(scoreTeamRowSrc.includes("<img"), false);

const scoresPickRowSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/features/scores/ScoresPickRow.tsx"),
  "utf8"
);
assert.match(scoresPickRowSrc, /<TeamLogo/);
assert.equal(scoresPickRowSrc.includes("/helmets/"), false);

const pickSideSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/features/pick/PickSideTeamLink.tsx"),
  "utf8"
);
assert.match(pickSideSrc, /<TeamLogo/);
assert.equal(pickSideSrc.includes("/helmets/"), false);
assert.equal(pickSideSrc.includes("<img"), false);

function walkTs(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkTs(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}
const helmetBuilders = walkTs(path.join(process.cwd(), "src")).filter((file) =>
  /`\/helmets\/\$\{/.test(fs.readFileSync(file, "utf8"))
);
assert.deepEqual(
  helmetBuilders.map((f) => path.relative(process.cwd(), f)),
  ["src/lib/team-helmets.ts"],
  "only localHelmetSrc builds /helmets/ paths"
);

const poolSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/features/home/HomePickHero.tsx"),
  "utf8"
);
assert.match(poolSrc, /TeamLogo/);
assert.match(poolSrc, /TEAM_LOGO_SIZE\.hero/);
assert.equal(poolSrc.includes("TEAM_LOGO_SIZE.compact"), false);
assert.equal(poolSrc.includes("TEAM_LOGO_SIZE.row"), false);

const scheduleSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/features/schedule/ScheduleGameRow.tsx"),
  "utf8"
);
assert.match(scheduleSrc, /<TeamLogo/);
assert.match(scheduleSrc, /TEAM_LOGO_SIZE\.compact/);
const scheduleLoadSrc = fs.readFileSync(
  path.join(process.cwd(), "src/components/features/schedule/load-schedule.ts"),
  "utf8"
);
assert.match(scheduleLoadSrc, /logoByAbbr/);

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
  ["CHI", espnTeamLogoUrl("CHI")],
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
