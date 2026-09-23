import assert from "node:assert/strict";
import { weekWrapAutoIntro, weekWrapCounts } from "../../src/lib/week-wrap-auto";
import { weekWrapContent } from "../../src/lib/week-wrap-copy";
import { weekWrapPlayers } from "../../src/lib/week-wrap-players";
import { wrapResultGroups } from "../../src/lib/week-wrap-results";
import { weekWrapShortText, WEEK_WRAP_BOARD_URL } from "../../src/lib/week-wrap-sections";

const seat = (id: string, status = "undefeated") => ({ id, nickname: id, status });
const pick = (membershipId: string, teamAbbr: string, result: string | null) =>
  ({ membershipId, teamAbbr, result });

const players = weekWrapPlayers(
  [
    seat("Zoe"), seat("Abe"), seat("Max"), seat("Liz"), seat("Ben"), seat("Kai"), seat("Ty"),
    seat("Ann", "one_loss"), seat("Bob", "one_loss"), seat("Cy", "eliminated"),
    seat("Dot", "one_loss"), seat("Eve"), seat("Fay"), seat("Old", "eliminated"),
  ],
  [
    pick("Zoe", "BUF", "win"), pick("Abe", "KC", "win"), pick("Max", "BUF", "win"),
    pick("Liz", "SF", "win"), pick("Ben", "BUF", "win"), pick("Kai", "KC", "win"),
    pick("Ty", "DET", "win"), pick("Ann", "MIA", "loss"), pick("Bob", "MISS", "missed"),
    pick("Cy", "MIA", "loss"), pick("Dot", "NYJ", "push"), pick("Fay", "LAR", null),
  ]
);
const facts = { weekNumber: 5, players, boardUrl: WEEK_WRAP_BOARD_URL };

const groups = wrapResultGroups(players);
const names = (list: { nickname: string }[]) => list.map((p) => p.nickname);
assert.deepEqual(names(groups.won), ["Ben", "Max", "Zoe", "Abe", "Kai", "Ty", "Liz"],
  "biggest team first, ties by abbr A-Z, nicknames A-Z inside a team");
assert.deepEqual(names(groups.lost), ["Ann", "Cy", "Dot", "Bob"], "no pick / MISS last");
assert.deepEqual(names(groups.out), ["Cy"]);
assert.deepEqual(names(groups.pending), ["Fay", "Eve"]);
console.log("PASS  same-team grouping + nickname A-Z");

assert.deepEqual(weekWrapCounts(facts), { stillIn: 12, won: 7, hit: 3, out: 1, pending: 2 });
const intro = "Week 5 wrap: 12 still in, 3 took a hit, 1 eliminated, 2 with no result yet.";
assert.equal(weekWrapAutoIntro(facts), intro);

const calm = weekWrapPlayers([seat("Ada"), seat("Bo")], [pick("Ada", "SF", "win"), pick("Bo", "SF", "win")]);
assert.equal(
  weekWrapAutoIntro({ weekNumber: 2, players: calm, boardUrl: WEEK_WRAP_BOARD_URL }),
  "Week 2 wrap: 2 still in, nobody took a hit, nobody out."
);
const last = weekWrapPlayers(
  [seat("Ada", "one_loss"), seat("Bo", "eliminated")],
  [pick("Ada", "SF", "win"), pick("Bo", "SF", "win")]
);
assert.equal(
  weekWrapAutoIntro({ weekNumber: 9, players: last, boardUrl: WEEK_WRAP_BOARD_URL }),
  "Week 9 wrap: 1 still in, nobody took a hit, nobody out. Ada is the last one standing."
);
console.log("PASS  automatic intro from facts");

const blocks = { roster: true, picks: true, board: true, drama: true };
const mail = weekWrapContent({ tone: "funny", blocks, facts });
assert.ok(mail.text.startsWith(`${intro}\n`));
assert.match(mail.text,
  /Won this week\n- Ben BUF\n- Max BUF\n- Zoe BUF\n- Abe KC\n- Kai KC\n- Ty DET\n- Liz SF\n/);
assert.match(mail.text, /Lost this week\n- Ann MIA \(still in\)\n- Cy MIA\n- Dot NYJ \(still in\)\n- Bob no pick \(still in\)\n/);
assert.match(mail.text, /No result yet\n- Fay LAR\n- Eve no pick/);
const html = mail.html ?? "";
let at = -1;
for (const name of ["Ben", "Max", "Zoe", "Abe", "Kai", "Ty", "Liz", "Ann", "Cy", "Dot", "Bob"]) {
  const next = html.search(new RegExp(`>${name}( <span|<)`));
  assert.ok(next > at, `${name} out of team order in HTML`);
  at = next;
}
console.log("PASS  email HTML + text grouped by team");

assert.equal(
  weekWrapShortText(facts, { ...blocks, roster: false, board: false }),
  "Week 5\nPicks: BUF won (Ben, Max, Zoe); KC won (Abe, Kai); MIA lost (Ann, Cy); DET won (Ty); LAR pending (Fay); NYJ lost (Dot); SF won (Liz); no pick (Bob)"
);
const sms = mail.smsBody ?? "";
assert.ok(sms.length <= 160, `sms is ${sms.length}`);
assert.match(sms, /^[\x20-\x7E\n]*$/, "plain GSM-7 text");
console.log("PASS  SMS picks grouped by team, still one trial segment");
