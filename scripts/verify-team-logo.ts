/**
 * Local-only team marks (`/helmets/{abbr}.png`) plus leftover ESPN URL helpers.
 *
 *   npx tsx scripts/verify-team-logo.ts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
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
assert.equal(resolveTeamLogoSrc("CHI", stale, localChi), TEAM_HELMET_PLACEHOLDER);
assert.equal(
  resolveTeamLogoSrc("CHI", stale, [localChi, stale]),
  TEAM_HELMET_PLACEHOLDER
);
assert.equal(resolveTeamLogoSrc("CHI", null, null), localChi);
assert.equal(
  resolveTeamLogoSrc("CHI", espnTeamLogoUrl("CHI"), localChi),
  TEAM_HELMET_PLACEHOLDER
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
assert.equal(resolveTeamLogoSrc("CHI", null, "gone"), localChi);
assert.equal(
  resolveTeamLogoSrc("PIT", "/helmets/PIT.png", null),
  "/helmets/pit.png"
);
assert.equal(
  resolveTeamLogoSrc("PIT", "/helmets/PIT.png", "/helmets/pit.png"),
  TEAM_HELMET_PLACEHOLDER
);
assert.equal(
  resolveTeamLogoSrc("PIT", null, [localHelmetSrc("PIT"), espnTeamLogoUrl("PIT")]),
  TEAM_HELMET_PLACEHOLDER
);
assert.doesNotMatch(resolveTeamLogoSrc("NE", espnTeamLogoUrl("NE"), null), /^https?:/i);
assert.doesNotMatch(resolveTeamLogoSrc("CLE", stale, null), /^https?:/i);

/** 8-bit RGBA PNG → pixels. Used to assert every helmet has the light plate. */
function pngRgba(file: string): { w: number; h: number; px: Buffer } {
  const buf = fs.readFileSync(file);
  let pos = 8;
  let w = 0;
  let h = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    const chunk = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = chunk.readUInt32BE(0);
      h = chunk.readUInt32BE(4);
      assert.equal(chunk[8], 8, `${file} 8-bit`);
      assert.equal(chunk[9], 6, `${file} RGBA`);
    } else if (type === "IDAT") idat.push(chunk);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = Buffer.alloc(h * stride);
  let i = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[i++];
    const row = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? row[x - 4] : 0;
      const b = prev[x];
      const c = x >= 4 ? prev[x - 4] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      const pr =
        f === 1
          ? a
          : f === 2
            ? b
            : f === 3
              ? (a + b) >> 1
              : f === 4
                ? pa <= pb && pa <= pc
                  ? a
                  : pb <= pc
                    ? b
                    : c
                : 0;
      if (f !== 0) row[x] = (row[x] + pr) & 255;
    }
    row.copy(px, y * stride);
    prev = row;
  }
  return { w, h, px };
}

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
  const png = pngRgba(file);
  assert.equal(png.w, 500, `${abbr} 500px`);
  assert.equal(png.h, 500, `${abbr} 500px`);
  assert.equal(png.px[3], 0, `${abbr} corner transparent`);
  const plate = (40 * png.w + 40) * 4;
  assert.equal(png.px[plate + 3], 255, `${abbr} plate opaque`);
  assert.ok(
    Math.abs(png.px[plate] - 232) < 8 &&
      Math.abs(png.px[plate + 1] - 234) < 8 &&
      Math.abs(png.px[plate + 2] - 238) < 8,
    `${abbr} light plate colour`
  );
  localHashes.add(createHash("sha256").update(bytes).digest("hex"));
}
assert.equal(localHashes.size, 32, "32 distinct local helmets");
assert.equal(
  fs.existsSync(path.join(process.cwd(), "public/helmets/_placeholder.svg")),
  true,
  "neutral placeholder helmet"
);
assert.equal(TEAM_HELMET_PLACEHOLDER, "/helmets/_placeholder.svg");
const helmetReadme = fs.readFileSync(
  path.join(process.cwd(), "public/helmets/README.md"),
  "utf8"
);
assert.match(helmetReadme, /light rounded plate/);
assert.match(helmetReadme, /Every `\{abbr\}\.png`/);
assert.equal(helmetReadme.includes("ne.png and cle.png are the same marks"), false);

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
assert.match(teamLogoSrc, /@\/lib\/team-helmets/);
assert.match(teamLogoSrc, /object-contain/);
assert.match(teamLogoSrc, /bg-stadium-800/);
assert.equal(teamLogoSrc.includes("bg-white"), false);
assert.equal(teamLogoSrc.includes("opacity-0"), false);
assert.equal(teamLogoSrc.includes("espncdn"), false);
assert.equal(teamLogoSrc.includes("espnTeamLogoUrl"), false);
assert.equal(teamLogoSrc.includes("teamBadge"), false);
assert.equal(teamLogoSrc.includes("TEAM_BADGES"), false);
assert.equal(teamLogoSrc.includes("29.png"), false);
assert.equal(teamLogoSrc.includes("abbr.slice"), false);
assert.equal(teamLogoSrc.includes("letter"), false);
assert.match(teamLogoSrc, /setFailed/);
assert.ok(teamLogoSrc.split("\n").length <= 100, "TeamLogo stays small");

const helmetLibSrc = fs.readFileSync(
  path.join(process.cwd(), "src/lib/team-helmets.ts"),
  "utf8"
);
assert.match(helmetLibSrc, /TEAM_HELMET_PLACEHOLDER/);
assert.equal(helmetLibSrc.includes("espncdn"), false);
assert.equal(helmetLibSrc.includes("espnTeamLogoUrl"), false);
assert.ok(helmetLibSrc.split("\n").length <= 100, "team-helmets stays small");

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

for (const abbr of Object.keys(ESPN_TEAM_IDS)) {
  const src = resolveTeamLogoSrc(abbr, espnTeamLogoUrl(abbr), null);
  assert.equal(src, localHelmetSrc(abbr), `${abbr} resolve is local`);
  assert.doesNotMatch(src, /^https?:/i, `${abbr} never remote`);
}

console.log("verify-team-logo: ok");
