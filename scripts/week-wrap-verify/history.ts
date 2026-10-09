import assert from "node:assert/strict";
import { weekWrapAutoIntro, weekWrapCounts } from "../../src/lib/week-wrap-auto";
import { weekWrapContent } from "../../src/lib/week-wrap-copy";
import { wrapWeekFromHistory } from "../../src/lib/week-wrap-as-of";
import {
  wrapShownResult,
  type WrapHistoryPick,
  type WrapRules,
  type WrapSeat,
} from "../../src/lib/week-wrap-history";
import { WEEK_WRAP_BOARD_URL } from "../../src/lib/week-wrap-sections";

const seat = (
  id: string,
  extra: Partial<WrapSeat> = {}
): WrapSeat => ({ id, nickname: id, ...extra });

const pick = (
  membershipId: string,
  weekNumber: number,
  teamAbbr: string,
  result: string | null,
  extra: Partial<WrapHistoryPick> = {}
): WrapHistoryPick => ({ membershipId, weekNumber, teamAbbr, result, ...extra });

const blocks = { roster: true, picks: true, board: true, drama: true };
const final = (
  awayAbbr: string,
  homeAbbr: string,
  scoreAway: number,
  scoreHome: number
) => ({ awayAbbr, homeAbbr, scoreAway, scoreHome, status: "final" });

function viewFacts(
  members: WrapSeat[],
  picks: WrapHistoryPick[],
  weekNumber: number,
  rules?: WrapRules
) {
  const view = wrapWeekFromHistory(members, picks, weekNumber, rules);
  return {
    view,
    mail: weekWrapContent({
      tone: "facts",
      blocks,
      facts: {
        weekNumber,
        players: view.players,
        board: view.board,
        boardUrl: WEEK_WRAP_BOARD_URL,
      },
    }),
  };
}

function agrees(view: ReturnType<typeof wrapWeekFromHistory>) {
  const byId = new Map(view.board.map((row) => [row.id, row]));
  for (const player of view.players) {
    const row = byId.get(player.id);
    assert.ok(row, player.nickname);
    assert.equal(row.status, player.status, player.nickname);
  }
  assert.equal(
    view.players.filter((player) => player.status !== "eliminated").length,
    view.board.filter((row) => row.status !== "eliminated").length
  );
}

const family = [
  seat("Ada"),
  seat("Bea"),
  seat("Cal"),
  seat("Dee"),
  seat("Spec", { role: "admin", isParticipant: false }),
];
const familyPicks = [
  pick("Bea", 2, "KC", "loss"),
  pick("Cal", 2, "KC", "loss"),
  pick("Dee", 2, "NYJ", "loss"),
  pick("Dee", 3, "DAL", "loss"),
  pick("Ada", 4, "MIN", "win"),
  pick("Bea", 4, "MIN", "win"),
  pick("Cal", 4, "BAL", "win"),
  pick("Dee", 4, "TB", "win"),
  pick("Ada", 5, "SF", "win"),
  pick("Cal", 5, "DAL", "win"),
  pick("Bea", 5, "TB", "loss"),
];

const week4 = viewFacts(family, familyPicks, 4);
const week5 = viewFacts(family, familyPicks, 5);
agrees(week4.view);
agrees(week5.view);

assert.equal(
  weekWrapAutoIntro({
    weekNumber: 4,
    players: week4.view.players,
    boardUrl: WEEK_WRAP_BOARD_URL,
  }),
  "Week 4 wrap: 3 still in, nobody took a hit, nobody out."
);
assert.deepEqual(weekWrapCounts({
  weekNumber: 4,
  players: week4.view.players,
  boardUrl: WEEK_WRAP_BOARD_URL,
}), { stillIn: 3, won: 3, hit: 0, out: 0, pending: 0 });
assert.match(week4.mail.text, /Won this week\n- Ada MIN\n- Bea MIN\n- Cal BAL/);
assert.match(week4.mail.text, /Lost this week\nNobody lost this week/);
assert.doesNotMatch(week4.mail.text.split("Lost this week")[0], /Dee|Spec/);
assert.doesNotMatch(week4.mail.text, /Eliminated this week/);
assert.match(week4.mail.text, /Dee - Eliminated/);
assert.doesNotMatch(week4.mail.text, /Spec/);
assert.match(week4.mail.text, /Bea - One loss/);
assert.doesNotMatch(week4.mail.text, /Bea - Eliminated/);
assert.equal(week4.view.board.find((row) => row.nickname === "Bea")?.losses, 1);

assert.equal(
  weekWrapAutoIntro({
    weekNumber: 5,
    players: week5.view.players,
    boardUrl: WEEK_WRAP_BOARD_URL,
  }),
  "Week 5 wrap: 2 still in, nobody took a hit, 1 eliminated."
);
assert.match(week5.mail.text, /Won this week\n- Cal DAL\n- Ada SF/);
assert.match(week5.mail.text, /Lost this week\n- Bea TB\n/);
assert.match(week5.mail.text, /Eliminated this week\n- Bea TB/);
assert.doesNotMatch(week5.mail.text.split("Pool leaderboard")[0], /Dee|Spec|Bea TB \(still in\)/);
assert.equal(week5.view.board.find((row) => row.nickname === "Bea")?.status, "eliminated");
assert.equal(week5.view.players.find((row) => row.nickname === "Ada")?.status, "undefeated");
console.log("PASS  week 4 keeps winners who go out in week 5");

const misses = viewFacts(
  [seat("Fay"), seat("Guy")],
  [pick("Guy", 2, "NYJ", "loss")],
  4,
  { lockedWeeks: [4] }
);
agrees(misses.view);
assert.match(misses.mail.text, /Lost this week\n- Fay no pick \(still in\)\n- Guy no pick\n/);
assert.match(misses.mail.text, /Eliminated this week\n- Guy no pick/);
assert.equal(
  weekWrapAutoIntro({
    weekNumber: 4,
    players: misses.view.players,
    boardUrl: WEEK_WRAP_BOARD_URL,
  }),
  "Week 4 wrap: 1 still in, 1 took a hit, 1 eliminated. Fay is the last one standing."
);
const guyLater = wrapWeekFromHistory(
  [seat("Guy")],
  [pick("Guy", 2, "NYJ", "loss"), pick("Guy", 5, "TB", "loss")],
  5,
  { lockedWeeks: [4] }
);
assert.equal(guyLater.players[0]?.outBeforeWeek, true);
assert.equal(guyLater.players[0]?.eliminatedThisWeek, false);
console.log("PASS  missed pick eliminates only in the week it was missed");

const dal = final("TB", "DAL", 10, 24);
const ungraded = viewFacts(
  [seat("Hal"), seat("Ivy")],
  [
    pick("Hal", 2, "KC", "loss"),
    pick("Hal", 4, "TB", null, { game: dal }),
    pick("Ivy", 4, "DAL", "pending", { game: dal }),
  ],
  4
);
assert.equal(ungraded.view.players.find((row) => row.nickname === "Hal")?.result, "loss");
assert.equal(ungraded.view.players.find((row) => row.nickname === "Ivy")?.result, "win");
assert.equal(ungraded.view.players.find((row) => row.nickname === "Hal")?.eliminatedThisWeek, true);
assert.match(ungraded.mail.text, /Won this week\n- Ivy DAL/);
assert.match(ungraded.mail.text, /Lost this week\n- Hal TB/);
assert.equal(
  wrapShownResult(pick("Hal", 4, "TB", "win", { game: dal })),
  "win",
  "a stored grade is not rewritten from the score"
);
assert.equal(
  wrapShownResult(
    pick("Hal", 4, "TB", null, { game: final("TB", "DAL", 17, 17) })
  ),
  "loss"
);
assert.equal(
  wrapShownResult(
    pick("Hal", 4, "TB", null, {
      game: { ...dal, status: "live", scoreAway: null, scoreHome: null },
    })
  ),
  null
);
console.log("PASS  pending finals use the score; stored grades stay put");

const late = viewFacts(
  [seat("Bo")],
  [pick("Bo", 2, "KC", "loss"), pick("Bo", 4, "MIN", "win")],
  4,
  { startWeek: 4 }
);
assert.equal(late.view.players[0]?.status, "undefeated");
assert.match(late.mail.text, /Won this week\n- Bo MIN/);
assert.equal(late.view.board[0]?.losses, 0);

const oneAndDone = viewFacts(
  [seat("Jo")],
  [pick("Jo", 4, "DAL", "loss")],
  4,
  { singleEliminationFromWeek: 4 }
);
assert.equal(oneAndDone.view.players[0]?.eliminatedThisWeek, true);
assert.match(oneAndDone.mail.text, /Eliminated this week\n- Jo DAL/);
assert.equal(
  weekWrapAutoIntro({
    weekNumber: 4,
    players: oneAndDone.view.players,
    boardUrl: WEEK_WRAP_BOARD_URL,
  }),
  "Week 4 wrap: nobody still in, nobody took a hit, 1 eliminated."
);

const newbie = viewFacts(
  [seat("New", { playingFromWeek: 5 })],
  [],
  4,
  { lockedWeeks: [4] }
);
assert.equal(newbie.view.players[0]?.result, null);
assert.equal(newbie.view.players[0]?.status, "undefeated");
console.log("PASS  start week, one-and-done, and playing-from week");

const owned = wrapWeekFromHistory([seat("Ada")], [pick("Ada", 4, "MIN", "win")], 4);
const borrowed = wrapWeekFromHistory(
  [seat("Bea")],
  [
    pick("Bea", 4, "MIN", "win"),
    pick("Bea", 5, "TB", null, { game: dal }),
  ],
  4,
  { singleEliminationFromWeek: 5 }
);
const borrowedLater = wrapWeekFromHistory(
  [seat("Bea")],
  [
    pick("Bea", 4, "MIN", "win"),
    pick("Bea", 5, "TB", null, { game: dal }),
  ],
  5,
  { singleEliminationFromWeek: 5 }
);
assert.deepEqual(owned.players.map((row) => row.nickname), ["Ada"]);
assert.equal(borrowed.players[0]?.status, "undefeated");
assert.equal(borrowed.players[0]?.result, "win");
assert.equal(borrowedLater.players[0]?.eliminatedThisWeek, true);
assert.equal(borrowedLater.players[0]?.result, "loss");
console.log("PASS  each pool uses its own picks, including a borrowed slate score");

const sms = week4.mail.smsBody ?? "";
assert.ok(sms.length <= 160, `sms is ${sms.length}`);
assert.match(sms, /^[\x20-\x7E\n]*$/);
assert.match(sms, /Still in: Ada, Bea, Cal/);
assert.doesNotMatch(sms, /Dee|Spec/);
console.log("PASS  week-scoped SMS stays one GSM-7 segment");
