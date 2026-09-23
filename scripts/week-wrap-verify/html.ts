import assert from "node:assert/strict";
import { PUBLIC_APP_ORIGIN } from "../../src/lib/invite-link";
import { weekWrapContent } from "../../src/lib/week-wrap-copy";
import { helmetUrl } from "../../src/lib/week-wrap-html-util";
import { wrapNflDivisions, type WrapNflTeamInput } from "../../src/lib/week-wrap-nfl";
import { weekWrapPlayers } from "../../src/lib/week-wrap-players";
import { WEEK_WRAP_BOARD_URL } from "../../src/lib/week-wrap-sections";
import { wrapPlayers } from "./copy";

const blocks = { roster: true, picks: true, board: true, drama: true };
const team = (abbr: string, conference: string, division: string, w: number, l: number, rank: number): WrapNflTeamInput =>
  ({ abbr, conference, division, wins: w, losses: l, ties: 0, divisionRank: rank });
const teams = [
  team("MIA", "AFC", "East", 1, 2, 2), team("BUF", "AFC", "East", 3, 0, 1),
  team("WAS", "NFC", "East", 2, 1, 1), team("KC", "AFC", "West", 2, 1, 1),
];
const nfl = wrapNflDivisions(teams);
assert.ok(nfl);
assert.deepEqual(nfl.map((d) => `${d.conference} ${d.division}`), ["AFC East", "AFC West", "NFC East"]);
assert.deepEqual(nfl[0].teams.map((t) => t.abbr), ["BUF", "MIA"]);
assert.equal(wrapNflDivisions(teams.map((t) => ({ ...t, wins: 0, losses: 0 }))), null, "never synced → omit");
console.log("PASS  NFL divisions grouping");

assert.equal(helmetUrl("SF"), `${PUBLIC_APP_ORIGIN}/helmets/sf.png`);
assert.equal(helmetUrl("WSH"), `${PUBLIC_APP_ORIGIN}/helmets/was.png`);

const board = [
  { id: "a", nickname: "Ada", status: "undefeated", losses: 0, weeksSurvived: 3 },
  { id: "b", nickname: "Bea", status: "one_loss", losses: 1, weeksSurvived: 2 },
  { id: "c", nickname: "Cal", status: "eliminated", losses: 2, weeksSurvived: 2 },
  { id: "d", nickname: "Dee", status: "eliminated", losses: 2, weeksSurvived: 1 },
];
const facts = { weekNumber: 3, players: wrapPlayers, boardUrl: WEEK_WRAP_BOARD_URL, board, nfl };
const rich = weekWrapContent({ tone: "funny", blocks, facts });
const html = rich.html ?? "";
const order = ["Won this week", "Lost this week", "Eliminated this week", "Pool leaderboard", "NFL division standings", "Drama placeholder", "Open the board", "account/notifications"];
let last = -1;
for (const label of order) {
  const at = html.indexOf(label);
  assert.ok(at > last, `${label} out of order or missing`);
  last = at;
}
assert.match(html, new RegExp(`src="${PUBLIC_APP_ORIGIN.replace(/[.]/g, "\\.")}/helmets/buf\\.png"`));
assert.match(html, /\/helmets\/was\.png/);
assert.doesNotMatch(html, /\/helmets\/[^"]*[A-Z]/, "helmet paths are lowercase");
assert.doesNotMatch(html, /wsh\.png|WSH/);
assert.match(html, /href="https:\/\/survive-sunday\.vercel\.app\/standings"/);
assert.doesNotMatch(html, /\/leaderboard/);
assert.doesNotMatch(html, /inline-block/, "NFL columns are nested tables");
assert.match(html, /<td width="50%" valign="top"/);
assert.match(html, /still in/);
assert.match(html, /3-0/);
assert.ok(html.indexOf(">Ada<") < html.indexOf(">Bea<"), "board keeps Leaderboard order");
assert.match(rich.text, /Pool leaderboard\n1\. Ada - Undefeated/);
assert.match(rich.text, /AFC East: BUF 3-0, MIA 1-2/);
assert.doesNotMatch(rich.smsBody ?? "", /helmets|Pool leaderboard|NFL|AFC/);
assert.ok((rich.smsBody ?? "").length <= 160);
console.log("PASS  rich email section order + lowercase helmets + /standings CTA");

const calm = weekWrapPlayers(
  [
    { id: "a", nickname: "Ada", status: "undefeated" },
    { id: "b", nickname: "<b>Bo</b>", status: "one_loss" },
  ],
  [
    { membershipId: "a", teamAbbr: "SF", result: "win" },
    { membershipId: "b", teamAbbr: "MISS", result: "missed" },
  ]
);
const noOut = weekWrapContent({
  tone: "facts",
  blocks,
  facts: { weekNumber: 4, players: calm, boardUrl: WEEK_WRAP_BOARD_URL, board: [], nfl: null },
});
const noOutHtml = noOut.html ?? "";
assert.doesNotMatch(noOutHtml, /Eliminated this week/, "section omitted when nobody went out");
assert.doesNotMatch(noOutHtml, /Pool leaderboard|NFL division standings/, "missing data → section omitted");
assert.match(noOutHtml, /Open the board/, "wrap still renders without board or NFL data");
assert.match(noOutHtml, /No pick/);
assert.match(noOutHtml, /&lt;b&gt;Bo&lt;\/b&gt;/);
assert.doesNotMatch(noOutHtml, /<b>Bo<\/b>/);
assert.doesNotMatch(noOutHtml, /helmets\/miss\.png/);
console.log("PASS  optional sections omitted + escaping");
