/**
 * Checks coach parse helpers + seeded 32-team file. Optional ESPN ping.
 * Usage: npx tsx scripts/verify-team-coaches.ts
 */
import fs from "fs";
import path from "path";
import {
  coachUrlSlug,
  espnCoachProfileUrl,
  formatCoachExperience,
  parseEspnCoach,
  parseEspnCoachRefList,
  wikipediaCoachSearchUrl,
  type EspnCoachDetail,
} from "../src/lib/coach-parse";
import { normAbbr } from "../src/lib/espn-teams";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const reid: EspnCoachDetail = {
  id: "17553",
  firstName: "Andy",
  lastName: "Reid",
  experience: 27,
  team: {
    $ref: "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/teams/12?lang=en&region=us",
  },
};

const parsed = parseEspnCoach(reid);
assert(parsed, "Andy Reid should parse");
assert(parsed!.abbreviation === "KC", `abbr ${parsed!.abbreviation}`);
assert(parsed!.name === "Andy Reid", `name ${parsed!.name}`);
assert(parsed!.espnCoachId === "17553", "coach id");
assert(
  parsed!.espnCoachUrl ===
    "https://www.espn.com/nfl/coaches/_/id/17553/andy-reid",
  "espn url"
);
assert(
  formatCoachExperience(27) === "27 seasons as an NFL head coach (ESPN).",
  "experience 27"
);
assert(
  formatCoachExperience(0) === "First season as an NFL head coach (ESPN).",
  "experience 0"
);
assert(
  wikipediaCoachSearchUrl("Andy Reid").includes("Andy%20Reid"),
  "wikipedia search"
);
assert(
  parseEspnCoachRefList({
    items: [
      {
        $ref: "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/coaches/17553",
      },
    ],
  })?.includes("17553"),
  "ref list"
);
assert(parseEspnCoach({ firstName: "Nobody" }) === null, "missing team");
assert(normAbbr("WSH") === "WAS", "WSH → WAS");
assert(coachUrlSlug("Kevin O'Connell") === "kevin-oconnell", "slug apostrophe");
assert(
  espnCoachProfileUrl("2146711", "Kevin O'Connell") ===
    "https://www.espn.com/nfl/coaches/_/id/2146711/kevin-oconnell",
  "slug url"
);

const seedPath = path.resolve(process.cwd(), "data/team_coaches.json");
assert(fs.existsSync(seedPath), `missing ${seedPath}`);
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8")) as {
  coaches?: Array<{
    abbreviation?: string;
    name?: string;
    espn_coach_url?: string;
  }>;
};
const rows = seed.coaches ?? [];
assert(rows.length === 32, `expected 32 coaches, got ${rows.length}`);
const abbrs = new Set(rows.map((r) => normAbbr(r.abbreviation || "")));
assert(abbrs.size === 32, `unique abbrs ${abbrs.size}`);
assert(abbrs.has("WAS") && !abbrs.has("WSH"), "WAS not WSH");
for (const row of rows) {
  assert((row.name || "").trim().length > 1, `empty name ${row.abbreviation}`);
  assert(
    /^https:\/\/www\.espn\.com\/nfl\/coaches\/_\/id\//.test(
      row.espn_coach_url || ""
    ),
    `bad espn url ${row.abbreviation}`
  );
}
const kc = rows.find((r) => r.abbreviation === "KC");
assert(kc?.name === "Andy Reid", `KC seed ${kc?.name}`);

console.log("coach parse + seed: ok (32 teams)");

async function livePing() {
  const headers = {
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    Referer: "https://www.espn.com/nfl/",
    "Accept-Language": "en-CA,en;q=0.9",
  };
  const listRes = await fetch(
    "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/teams/12/coaches",
    { headers }
  );
  if (!listRes.ok) {
    console.log(`live ESPN ping skipped (HTTP ${listRes.status})`);
    return;
  }
  const list = (await listRes.json()) as { items?: Array<{ $ref?: string }> };
  const ref = parseEspnCoachRefList(list);
  assert(ref, "live KC coach ref missing");
  const detailRes = await fetch(ref!.replace(/^http:\/\//, "https://"), {
    headers,
  });
  assert(detailRes.ok, `live coach HTTP ${detailRes.status}`);
  const live = parseEspnCoach((await detailRes.json()) as EspnCoachDetail, "12");
  assert(live?.abbreviation === "KC", `live abbr ${live?.abbreviation}`);
  assert((live?.name || "").length > 1, "live name empty");
  console.log(`live ESPN ping: KC head coach ${live!.name}`);
}

livePing()
  .then(() => console.log("verify-team-coaches: ok"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
