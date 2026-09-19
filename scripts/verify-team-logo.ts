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

/** Decode one RGBA pixel. Stops after that row so 4096² NYJ stays cheap. */
function pngRgbaAt(
  file: string,
  x: number,
  y: number
): [number, number, number, number] {
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
  let i = 0;
  let prev = Buffer.alloc(stride);
  let row = Buffer.alloc(stride);
  for (let rowY = 0; rowY <= y; rowY++) {
    const f = raw[i++];
    row = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let col = 0; col < stride; col++) {
      const a = col >= 4 ? row[col - 4] : 0;
      const b = prev[col];
      const c = col >= 4 ? prev[col - 4] : 0;
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
      if (f !== 0) row[col] = (row[col] + pr) & 255;
    }
    prev = row;
  }
  const o = x * 4;
  return [row[o], row[o + 1], row[o + 2], row[o + 3]];
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
  assert.equal(pngRgbaAt(file, 0, 0)[3], 0, `${abbr} corner transparent`);
  assert.equal(
    pngRgbaAt(file, 40, 40)[3],
    0,
    `${abbr} has no white plate at (40,40)`
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
assert.match(helmetReadme, /transparent background/);
assert.match(helmetReadme, /no white rounded plates/);
assert.equal(helmetReadme.includes("ne.png and cle.png are the same marks"), false);
const neFile = path.join(process.cwd(), "public/helmets/ne.png");
const cleFile = path.join(process.cwd(), "public/helmets/cle.png");

function isNearWhiteOpaque(
  px: [number, number, number, number]
): boolean {
  const [r, g, b, a] = px;
  return a >= 180 && r >= 230 && g >= 230 && b >= 230;
}

function assertTransparent(
  file: string,
  x: number,
  y: number,
  label: string
): void {
  const px = pngRgbaAt(file, x, y);
  assert.equal(px[3], 0, `${label} @ (${x},${y}) is transparent`);
  assert.equal(isNearWhiteOpaque(px), false, `${label} @ (${x},${y}) is not a white plate`);
}

/** #124 restored ESPN marks whose corners/(40,40) are clear but a thick
 *  white sticker stroke still reads as a rounded plate at 44px Scores.
 *  These samples sit in that stroke on the pre-fix files. */
assertTransparent(neFile, 25, 200, "NE plate");
assertTransparent(neFile, 300, 140, "NE plate");
assertTransparent(cleFile, 30, 200, "CLE plate");
assertTransparent(cleFile, 25, 200, "CLE plate");
const neMark = pngRgbaAt(neFile, 320, 220);
assert.ok(neMark[3] > 200, "NE mark is opaque at the helmet");
assert.equal(isNearWhiteOpaque(neMark), false, "NE mark is not a white plate");
assert.ok(neMark[2] > neMark[0], "NE mark is navy");
const cleMark = pngRgbaAt(cleFile, 250, 250);
assert.ok(cleMark[3] > 200, "CLE mark is opaque at centre");
assert.equal(isNearWhiteOpaque(cleMark), false, "CLE mark is not a white plate");
assert.ok(cleMark[0] > 200 && cleMark[1] < 80, "CLE mark is orange");

/** Phone-width Scores (44px): mapped plate samples stay clear. */
function sampleAtDisplay(
  file: string,
  sx: number,
  sy: number,
  display = 44,
  source = 500
): [number, number, number, number] {
  const x = Math.min(source - 1, Math.round((sx + 0.5) * (source / display) - 0.5));
  const y = Math.min(source - 1, Math.round((sy + 0.5) * (source / display) - 0.5));
  return pngRgbaAt(file, x, y);
}
for (const [file, label] of [
  [neFile, "NE"],
  [cleFile, "CLE"],
] as const) {
  for (const [dx, dy] of [
    [0, 0],
    [1, 1],
    [2, 2],
    [41, 2],
    [2, 41],
    [43, 43],
  ] as const) {
    assert.equal(
      isNearWhiteOpaque(sampleAtDisplay(file, dx, dy)),
      false,
      `${label} 44px Scores corner (${dx},${dy}) is not a white plate`
    );
  }
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
assert.match(teamLogoSrc, /resolveTeamLogoSrc/);
assert.match(teamLogoSrc, /@\/lib\/team-helmets/);
assert.match(teamLogoSrc, /object-contain/);
assert.match(teamLogoSrc, /bg-stadium-800/);
assert.equal(teamLogoSrc.includes("bg-white"), false);
assert.equal(teamLogoSrc.includes("bg-gray"), false);
assert.doesNotMatch(teamLogoSrc, /className="[^"]*bg-white/);
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
