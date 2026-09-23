import assert from "node:assert/strict";
import { PREFS_URL } from "../../src/lib/notify-game-footer";
import { WEEK_WRAP_BOARD_URL } from "../../src/lib/week-wrap-sections";
import { WEEK_WRAP_FUNNY_DRAMA } from "../../src/lib/week-wrap-tone";
import { weekWrapContent } from "../../src/lib/week-wrap-copy";
import { weekWrapPlayers } from "../../src/lib/week-wrap-players";

export const wrapPlayers = weekWrapPlayers(
  [
    { id: "a", nickname: "Ada", status: "undefeated", role: "member", isParticipant: true },
    { id: "b", nickname: "Bea", status: "one_loss", role: "member", isParticipant: true },
    { id: "c", nickname: "Cal", status: "eliminated", role: "member", isParticipant: true },
    { id: "d", nickname: "Dee", status: "eliminated", role: "member", isParticipant: true },
    { id: "s", nickname: "Spec", status: "undefeated", role: "admin", isParticipant: false },
  ],
  [
    { membershipId: "a", teamAbbr: "BUF", result: "win" },
    { membershipId: "b", teamAbbr: "KC", result: "loss" },
    { membershipId: "c", teamAbbr: "DAL", result: "loss" },
  ]
);
const players = wrapPlayers;
assert.deepEqual(players.map((p) => p.nickname), ["Ada", "Bea", "Cal", "Dee"]);
assert.equal(players.find((p) => p.nickname === "Cal")?.eliminatedThisWeek, true);
assert.equal(players.find((p) => p.nickname === "Dee")?.eliminatedThisWeek, false);
assert.equal(players.find((p) => p.nickname === "Ada")?.id, "a");

const facts = { weekNumber: 3, players, boardUrl: WEEK_WRAP_BOARD_URL };
const blocks = { roster: true, picks: true, board: true, drama: true };
const funny = weekWrapContent({ tone: "funny", blocks, facts });
const factsCopy = weekWrapContent({ tone: "facts", blocks, facts });
const short = weekWrapContent({ tone: "short", blocks, facts });
const autoIntro = "Week 3 wrap: 2 still in, 1 took a hit, 1 eliminated.";
assert.equal(factsCopy.subject, "Week 3 wrap");
assert.ok(factsCopy.text.startsWith(`${autoIntro}\n`), "Straight intro is automatic from facts");
assert.match(factsCopy.htmlBody, new RegExp(autoIntro.replace(/[.]/g, "\\.")));
assert.equal(funny.subject, factsCopy.subject, "Funny uses the Straight copy until a paste");
assert.equal(funny.text, factsCopy.text);
assert.equal(funny.html, factsCopy.html);
assert.equal(WEEK_WRAP_FUNNY_DRAMA, "", "no invented drama line");
assert.ok(short.text.startsWith(`${autoIntro}\n`));
assert.equal(short.subject, "Wk 3 wrap");
for (const c of [funny, factsCopy, short]) {
  assert.doesNotMatch(`${c.subject}\n${c.text}\n${c.html}`, /placeholder/i);
}
assert.match(funny.text, /Won this week\n- Ada BUF/);
assert.match(funny.text, /Lost this week\n- Cal DAL\n- Bea KC \(still in\)\n/, "grouped by team");
assert.match(funny.text, /Eliminated this week\n- Cal DAL/);
assert.doesNotMatch(funny.text, /Dee/, "out before this week: no ghost row");
assert.match(funny.text, /Board: .*\/standings/);
assert.match(funny.text, /Preferences:/);
assert.match(funny.text, new RegExp(PREFS_URL.replace(/[.]/g, "\\.")));
assert.match(funny.htmlBody, /font-size:12px/);
assert.match(funny.htmlBody, /account\/notifications/);
assert.match(funny.html ?? "", /^<!doctype html>/);
assert.equal((funny.html ?? "").match(/account\/notifications/g)?.length, 1, "one prefs footer");
assert.doesNotMatch(funny.smsBody ?? "", /placeholder|<|helmets/i);
assert.match(funny.smsBody ?? "", /Still in: Ada, Bea/);
assert.match(funny.smsBody ?? "", /Picks: BUF won \(Ada\); DAL lost \(Cal\); KC lost \(Bea\)/);
assert.ok((funny.smsBody ?? "").length <= 160);
assert.match(short.text, /Preferences:/);
assert.match(short.text, /Won this week/);
assert.ok((short.smsBody ?? "").length <= 160);
assert.equal(short.smsBody, funny.smsBody);
const brief = weekWrapContent({
  tone: "short",
  blocks,
  facts,
  smsOverride: "Week 3 wrap",
});
assert.match(brief.smsBody ?? "", /Week 3 wrap/);
assert.match(brief.smsBody ?? "", /Prefs:/);
assert.ok((brief.smsBody ?? "").length <= 160);
const quiet = weekWrapContent({
  tone: "funny",
  blocks: { roster: false, picks: false, board: false, drama: false },
  facts,
});
assert.doesNotMatch(quiet.text, /Won this week|Lost this week|Pool leaderboard|Board:|placeholder/i);
assert.ok(quiet.text.startsWith(autoIntro), "intro stays when every block is off");
assert.doesNotMatch(quiet.htmlBody, /Won this week|Pool leaderboard|Open the board/);
const clip = {
  videoId: "abc123",
  title: "Every Touchdown of Week 3",
  watchUrl: "https://www.youtube.com/watch?v=abc123",
  shortUrl: "https://youtu.be/abc123",
  thumbUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
};
const withClip = weekWrapContent({ tone: "facts", blocks, facts, touchdown: clip });
assert.match(withClip.text, /Every Touchdown of Week 3/);
assert.match(withClip.text, /Preferences:/);
assert.match(withClip.htmlBody, /hqdefault\.jpg/);
assert.match(withClip.htmlBody, /font-size:12px/);
assert.ok((withClip.smsBody ?? "").length <= 160);
assert.match(withClip.text, /account\/notifications/);
const longSms = "x".repeat(470);
const omitted = weekWrapContent({
  tone: "facts",
  blocks,
  facts,
  smsOverride: longSms,
  touchdown: clip,
});
assert.doesNotMatch(omitted.smsBody ?? "", /youtu\.be/);
assert.doesNotMatch(omitted.smsBody ?? "", /account\/notifications/);
assert.ok((omitted.smsBody ?? "").length <= 160);
assert.match(omitted.smsBody ?? "", /\.\.\.$/);
const custom = weekWrapContent({
  tone: "facts",
  blocks,
  facts,
  emailOverride: "Custom email",
  touchdown: clip,
});
assert.match(custom.text, /^Custom email/);
assert.doesNotMatch(custom.text, /still in, 1 took a hit/, "override replaces the auto intro");
assert.equal(custom.subject, factsCopy.subject, "override leaves the subject");
assert.match(custom.text, /Won this week/, "override replaces only the intro");
assert.match(custom.text, /watch\?v=abc123/);
assert.match(custom.htmlBody, /Custom email/);
assert.match(custom.htmlBody, /font-size:12px/);
console.log("PASS  template copy");
