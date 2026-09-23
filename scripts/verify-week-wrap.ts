/**
 * Week wrap eligibility, copy, and dedupe keys (no database, no network).
 *
 *   npx tsx scripts/verify-week-wrap.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveChannels } from "../src/lib/notify-channels";
import { WEEK_WRAP_BOARD_URL, weekWrapContent } from "../src/lib/week-wrap-copy";
import { weekWrapPlayers } from "../src/lib/week-wrap-players";
import {
  parseWeekWrapRequest,
  weekNumbersFromDedupeKeys,
  weekWrapClaimKeys,
  withSkippedWeek,
} from "../src/lib/week-wrap-types";
import {
  isEligibleNextMorning,
  preferredWrapWeek,
  shouldAutoSend,
  torontoDateKey,
} from "../src/lib/week-wrap-when";
import { DEFAULT_NOTIFICATION_PREFS } from "../src/lib/notification-types";

const sundayKick = new Date("2026-09-14T00:00:00.000Z"); // Sun 8:00 p.m. Toronto
const sundayLate = new Date("2026-09-14T03:30:00.000Z"); // Sun 11:30 p.m. Toronto
const mondayMorning = new Date("2026-09-14T12:00:00.000Z"); // Mon 8:00 a.m. Toronto
const mondayNight = new Date("2026-09-15T00:15:00.000Z"); // Mon 8:15 p.m. Toronto
const mondayLate = new Date("2026-09-15T03:00:00.000Z"); // Mon 11:00 p.m. Toronto
const tuesdayMorning = new Date("2026-09-15T11:00:00.000Z"); // Tue 7:00 a.m. Toronto
const tuesdayNight = new Date("2026-09-16T00:15:00.000Z"); // Tue 8:15 p.m. Toronto
const wednesdayMorning = new Date("2026-09-16T12:00:00.000Z"); // Wed 8:00 a.m. Toronto

assert.equal(torontoDateKey(sundayKick), "2026-09-13");
assert.equal(torontoDateKey(mondayMorning), "2026-09-14");

const sundayFinal = [{ status: "final", kickoff: sundayKick }];
assert.equal(isEligibleNextMorning(sundayFinal, sundayLate), false);
assert.equal(isEligibleNextMorning(sundayFinal, mondayMorning), true);
assert.equal(isEligibleNextMorning([], mondayMorning), false);
assert.equal(
  isEligibleNextMorning(
    [
      { status: "final", kickoff: sundayKick },
      { status: "live", kickoff: mondayNight },
    ],
    tuesdayMorning
  ),
  false
);
assert.equal(
  isEligibleNextMorning([{ status: "final", kickoff: null }], mondayMorning),
  false
);

const mondayFinal = [{ status: "final", kickoff: mondayNight }];
assert.equal(isEligibleNextMorning(mondayFinal, mondayLate), false);
assert.equal(isEligibleNextMorning(mondayFinal, tuesdayMorning), true);

const tuesdayFinal = [{ status: "final", kickoff: tuesdayNight }];
assert.equal(isEligibleNextMorning(tuesdayFinal, wednesdayMorning), true);
assert.equal(
  isEligibleNextMorning(sundayFinal, new Date("2026-09-21T12:00:00.000Z")),
  false
);
assert.equal(
  shouldAutoSend({
    games: sundayFinal,
    now: mondayMorning,
    skippedWeeks: [3],
    weekNumber: 3,
  }),
  false
);
assert.equal(
  shouldAutoSend({
    games: sundayFinal,
    now: mondayMorning,
    skippedWeeks: [],
    weekNumber: 3,
  }),
  true
);
assert.equal(
  preferredWrapWeek(
    [
      { number: 4, eligible: false, allFinal: false },
      { number: 3, eligible: true, allFinal: true },
    ],
    1
  ),
  3
);
console.log("PASS  next-morning eligibility");

const keys = weekWrapClaimKeys("pool", 2);
assert.equal(keys.base, "wrap:pool:w2");
assert.equal(keys.email, "wrap:pool:w2:email");
assert.equal(keys.sms, "wrap:pool:w2:sms");
assert.deepEqual(weekWrapClaimKeys("pool", 2), keys);
assert.notEqual(keys.email, weekWrapClaimKeys("pool", 3).email);
const seen = new Set<string>();
function claim(userId: string, week: number, channel: "email" | "sms") {
  const key = `${userId}|weekWrap|${weekWrapClaimKeys("pool", week)[channel]}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}
assert.equal(claim("u1", 2, "email"), true);
assert.equal(claim("u1", 2, "email"), false);
assert.equal(claim("u1", 2, "sms"), true);
assert.equal(claim("u2", 2, "email"), true);
assert.equal(claim("u1", 3, "email"), true);
assert.deepEqual(
  weekNumbersFromDedupeKeys(["wrap:pool:w2:email", "wrap:pool:w4"], "pool"),
  new Set([2, 4])
);
assert.deepEqual(withSkippedWeek([1], 2, true), [1, 2]);
assert.deepEqual(withSkippedWeek([1, 2], 2, false), [1]);
console.log("PASS  dedupe keys");

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
assert.equal(players.find((p) => p.nickname === "Bea")?.eliminatedThisWeek, false);

const facts = { weekNumber: 3, players, boardUrl: WEEK_WRAP_BOARD_URL };
const blocks = { roster: true, picks: true, board: true, drama: true };
const funny = weekWrapContent({ tone: "funny", blocks, facts });
const factsCopy = weekWrapContent({ tone: "facts", blocks, facts });
const short = weekWrapContent({ tone: "short", blocks, facts });
assert.match(funny.text, /Cal is out/);
assert.match(funny.text, /Still in: Ada, Bea/);
assert.match(funny.text, /Lost: Bea, Cal/);
assert.match(funny.text, /Eliminated: Cal/);
assert.match(funny.text, /Ada BUF won/);
assert.match(funny.text, /\/standings/);
assert.doesNotMatch(funny.smsBody ?? "", /unbearable/);
assert.match(funny.smsBody ?? "", /Still in: Ada, Bea/);
assert.doesNotMatch(factsCopy.text, /unbearable|damage/);
assert.equal(short.text, short.smsBody);
assert.equal(short.smsBody, funny.smsBody);
const quiet = weekWrapContent({
  tone: "funny",
  blocks: { roster: false, picks: false, board: false, drama: false },
  facts,
});
assert.doesNotMatch(quiet.text, /Still in:|Picks:|Leaderboard:|unbearable/);
const overridden = weekWrapContent({
  tone: "funny",
  blocks,
  facts,
  emailOverride: "Custom email",
  smsOverride: "Custom sms",
});
assert.equal(overridden.text, "Custom email");
assert.equal(overridden.smsBody, "Custom sms");
assert.doesNotMatch(funny.text + (funny.smsBody ?? ""), /youtube|division/i);
console.log("PASS  template copy");

assert.equal(DEFAULT_NOTIFICATION_PREFS.weekWrap, "email");
assert.deepEqual(
  resolveChannels({ masterOn: true }, "game", undefined, "weekWrap"),
  ["email"]
);
assert.deepEqual(
  resolveChannels(
    { masterOn: false, channels: { weekWrap: "email" } },
    "game",
    undefined,
    "weekWrap"
  ),
  []
);
assert.deepEqual(
  resolveChannels(
    { masterOn: true, channels: { weekWrap: "off" } },
    "game",
    undefined,
    "weekWrap"
  ),
  []
);
assert.deepEqual(
  resolveChannels(
    { masterOn: true, channels: { weekWrap: "both" } },
    "game",
    undefined,
    "weekWrap"
  ),
  ["email", "sms"]
);
const bad = parseWeekWrapRequest({ action: "send", weekNumber: 1, tone: "wild" });
assert.equal(bad.ok, false);
console.log("PASS  weekWrap prefs");

const send = readFileSync("src/lib/week-wrap-send.ts", "utf8");
assert.match(send, /weekWrapDedupeKey/);
assert.match(send, /notifyUser/);
assert.match(send, /type: "weekWrap"/);
const dispatch = readFileSync("src/lib/notify-dispatch.ts", "utf8");
assert.match(dispatch, /\$\{opts\.dedupeKey\}:\$\{plan\.channel\}/);
const cron = readFileSync("src/app/api/cron/week-wrap/route.ts", "utf8");
assert.match(cron, /cronAuthorized/);
assert.match(cron, /runDueWeekWraps/);
const run = readFileSync("src/lib/week-wrap-run.ts", "utf8");
assert.match(run, /syncWeekScoresFromEspn/);
assert.match(readFileSync("src/lib/week-wrap-send.ts", "utf8"), /syncWeekScoresFromEspn/);
const vercel = readFileSync("vercel.json", "utf8");
assert.match(vercel, /\/api\/cron\/week-wrap/);
assert.match(vercel, /"schedule": "0 12 \* \* \*"/);
const system = readFileSync("src/components/features/admin/SystemScreen.tsx", "utf8");
assert.match(system, /WeekWrapPanel/);
const help = readFileSync("src/components/features/help/HelpForAdmins.tsx", "utf8");
assert.match(help, /Week wrap/);
assert.match(help, /Send now/);
assert.match(help, /Skip this week/);
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: { build: string };
};
assert.equal(pkg.scripts.build, "next build");
assert.doesNotMatch(readFileSync("src/lib/week-wrap-copy.ts", "utf8"), /openai|anthropic|generateText/i);
console.log("PASS  cron + admin wiring");

console.log("\nverify-week-wrap OK");
