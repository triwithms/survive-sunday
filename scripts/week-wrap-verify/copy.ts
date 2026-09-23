import assert from "node:assert/strict";
import { PREFS_URL } from "../../src/lib/notify-game-footer";
import { WEEK_WRAP_BOARD_URL } from "../../src/lib/week-wrap-sections";
import { WEEK_WRAP_DRAMA_PLACEHOLDER } from "../../src/lib/week-wrap-tone";
import { weekWrapContent } from "../../src/lib/week-wrap-copy";
import { weekWrapPlayers } from "../../src/lib/week-wrap-players";

const players = weekWrapPlayers(
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
assert.deepEqual(players.map((p) => p.nickname), ["Ada", "Bea", "Cal", "Dee"]);
assert.equal(players.find((p) => p.nickname === "Cal")?.eliminatedThisWeek, true);
assert.equal(players.find((p) => p.nickname === "Dee")?.eliminatedThisWeek, false);

const facts = { weekNumber: 3, players, boardUrl: WEEK_WRAP_BOARD_URL };
const blocks = { roster: true, picks: true, board: true, drama: true };
const funny = weekWrapContent({ tone: "funny", blocks, facts });
const factsCopy = weekWrapContent({ tone: "facts", blocks, facts });
const short = weekWrapContent({ tone: "short", blocks, facts });
assert.match(funny.text, /Funny placeholder/);
assert.match(funny.text, new RegExp(WEEK_WRAP_DRAMA_PLACEHOLDER));
assert.match(funny.text, /Still in: Ada, Bea/);
assert.match(funny.text, /Ada BUF won/);
assert.match(funny.text, /\/standings/);
assert.match(funny.text, /Preferences:/);
assert.match(funny.text, new RegExp(PREFS_URL.replace(/[.]/g, "\\.")));
assert.match(funny.htmlBody, /font-size:12px/);
assert.match(funny.htmlBody, /account\/notifications/);
assert.doesNotMatch(funny.smsBody ?? "", /Drama placeholder|Funny placeholder/);
assert.match(funny.smsBody ?? "", /Still in: Ada, Bea/);
assert.ok((funny.smsBody ?? "").length <= 160);
assert.match(funny.text, /account\/notifications/);
assert.doesNotMatch(factsCopy.text, /Funny placeholder|Drama placeholder/);
assert.match(short.text, /Preferences:/);
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
assert.doesNotMatch(quiet.text, /Still in:|Picks:|Leaderboard:|Drama placeholder/);
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
assert.match(withClip.htmlBody, /<img/);
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
assert.match(custom.text, /watch\?v=abc123/);
assert.match(custom.htmlBody, /font-size:12px/);
console.log("PASS  template copy");
