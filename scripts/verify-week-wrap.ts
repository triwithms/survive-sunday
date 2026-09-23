/**
 * Week wrap eligibility, copy, and dedupe keys (no database, no network).
 *
 *   npx tsx scripts/verify-week-wrap.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveChannels } from "../src/lib/notify-channels";
import { WEEK_WRAP_BOARD_URL, weekWrapContent } from "../src/lib/week-wrap-copy";
import {
  pickTouchdownClip,
  titleStartsTouchdownWeek,
} from "../src/lib/week-wrap-touchdown";
import { findWeekTouchdownVideo } from "../src/lib/week-wrap-youtube";
import { YT_NFL } from "../src/lib/youtube-channels";
import { weekWrapPlayers } from "../src/lib/week-wrap-players";
import {
  parseWeekWrapRequest,
  weekNumbersFromDedupeKeys,
  weekWrapClaimKeys,
  withSkippedWeek,
} from "../src/lib/week-wrap-types";
import {
  isEligibleNoonDayAfter,
  preferredWrapWeek,
  shouldAutoSend,
  torontoDateKey,
} from "../src/lib/week-wrap-when";
import { DEFAULT_NOTIFICATION_PREFS } from "../src/lib/notification-types";

const sundayKick = new Date("2026-09-14T00:00:00.000Z"); // Sun 8:00 p.m. Toronto
const sundayLate = new Date("2026-09-14T03:30:00.000Z"); // Sun 11:30 p.m. Toronto
const mondayBeforeNoon = new Date("2026-09-14T15:00:00.000Z"); // Mon 11:00 a.m. Toronto
const mondayNoon = new Date("2026-09-14T16:00:00.000Z"); // Mon noon Toronto
const mondayNight = new Date("2026-09-15T00:15:00.000Z"); // Mon 8:15 p.m. Toronto
const mondayLate = new Date("2026-09-15T03:40:00.000Z"); // Mon 11:40 p.m. Toronto
const tuesdayBeforeNoon = new Date("2026-09-15T15:00:00.000Z"); // Tue 11:00 a.m. Toronto
const tuesdayNoon = new Date("2026-09-15T16:00:00.000Z"); // Tue noon Toronto
const tuesdayNight = new Date("2026-09-16T00:15:00.000Z"); // Tue 8:15 p.m. Toronto
const wednesdayBeforeNoon = new Date("2026-09-16T15:00:00.000Z"); // Wed 11:00 a.m. Toronto
const wednesdayNoon = new Date("2026-09-16T16:00:00.000Z"); // Wed noon Toronto

assert.equal(torontoDateKey(sundayKick), "2026-09-13");
assert.equal(torontoDateKey(mondayNoon), "2026-09-14");

const sundayFinal = [{ status: "final", kickoff: sundayKick }];
assert.equal(isEligibleNoonDayAfter(sundayFinal, sundayLate), false);
assert.equal(isEligibleNoonDayAfter(sundayFinal, mondayBeforeNoon), false);
assert.equal(isEligibleNoonDayAfter(sundayFinal, mondayNoon), true);
assert.equal(isEligibleNoonDayAfter([], mondayNoon), false);
assert.equal(
  isEligibleNoonDayAfter(
    [
      { status: "final", kickoff: sundayKick },
      { status: "live", kickoff: mondayNight },
    ],
    tuesdayNoon
  ),
  false
);
assert.equal(
  isEligibleNoonDayAfter([{ status: "final", kickoff: null }], mondayNoon),
  false
);

const mondayFinal = [{ status: "final", kickoff: mondayNight }];
assert.equal(isEligibleNoonDayAfter(mondayFinal, mondayLate), false);
assert.equal(isEligibleNoonDayAfter(mondayFinal, tuesdayBeforeNoon), false);
assert.equal(isEligibleNoonDayAfter(mondayFinal, tuesdayNoon), true);

const tuesdayFinal = [{ status: "final", kickoff: tuesdayNight }];
assert.equal(isEligibleNoonDayAfter(tuesdayFinal, wednesdayBeforeNoon), false);
assert.equal(isEligibleNoonDayAfter(tuesdayFinal, wednesdayNoon), true);
const estMondayNight = new Date("2027-01-05T01:00:00.000Z"); // Mon 8:00 p.m. EST
const estTuesdayEleven = new Date("2027-01-05T16:00:00.000Z"); // Tue 11:00 a.m. EST
const estTuesdayNoon = new Date("2027-01-05T17:00:00.000Z"); // Tue noon EST
const estFinal = [{ status: "final", kickoff: estMondayNight }];
assert.equal(isEligibleNoonDayAfter(estFinal, estTuesdayEleven), false);
assert.equal(isEligibleNoonDayAfter(estFinal, estTuesdayNoon), true);
assert.equal(
  isEligibleNoonDayAfter(sundayFinal, new Date("2026-09-21T16:00:00.000Z")),
  false
);
assert.equal(
  shouldAutoSend({
    games: sundayFinal,
    now: mondayNoon,
    skippedWeeks: [3],
    weekNumber: 3,
  }),
  false
);
assert.equal(
  shouldAutoSend({
    games: sundayFinal,
    now: mondayBeforeNoon,
    skippedWeeks: [],
    weekNumber: 3,
  }),
  false
);
assert.equal(
  shouldAutoSend({
    games: sundayFinal,
    now: mondayNoon,
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
console.log("PASS  noon day-after eligibility");

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
const clip = {
  videoId: "abc123",
  title: "Every Touchdown of Week 3",
  watchUrl: "https://www.youtube.com/watch?v=abc123",
  shortUrl: "https://youtu.be/abc123",
  thumbUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
};
const withClip = weekWrapContent({ tone: "facts", blocks, facts, touchdown: clip });
assert.match(withClip.text, /Every Touchdown of Week 3/);
assert.match(withClip.text, /watch\?v=abc123/);
assert.match(withClip.htmlBody, /<img/);
assert.match(withClip.htmlBody, /hqdefault\.jpg/);
assert.match(withClip.smsBody ?? "", /youtu\.be\/abc123/);
const longSms = "x".repeat(470);
const omitted = weekWrapContent({
  tone: "facts",
  blocks,
  facts,
  smsOverride: longSms,
  touchdown: clip,
});
assert.equal(omitted.smsBody, longSms);
assert.match(omitted.text, /watch\?v=abc123/);
const custom = weekWrapContent({
  tone: "facts",
  blocks,
  facts,
  emailOverride: "Custom email",
  touchdown: clip,
});
assert.match(custom.text, /^Custom email/);
assert.match(custom.text, /watch\?v=abc123/);
console.log("PASS  template copy");

assert.equal(titleStartsTouchdownWeek("Every Touchdown of Week 3", 3), true);
assert.equal(
  titleStartsTouchdownWeek("Every Touchdown of Week 3 | 2026 NFL Season", 3),
  true
);
assert.equal(titleStartsTouchdownWeek("Every Touchdown of Week 13", 3), false);
assert.equal(titleStartsTouchdownWeek("Every Touchdown of Week 13", 1), false);
assert.equal(titleStartsTouchdownWeek("Week 3 every touchdown", 3), false);
const picked = pickTouchdownClip(
  {
    items: [
      {
        id: { videoId: "old" },
        snippet: {
          title: "Every Touchdown of Week 3 | 2024",
          publishedAt: "2024-09-20T00:00:00Z",
          thumbnails: { high: { url: "https://img.example/old.jpg" } },
        },
      },
      {
        id: { videoId: "new" },
        snippet: {
          title: "Every Touchdown of Week 3",
          publishedAt: "2026-09-22T00:00:00Z",
          thumbnails: { medium: { url: "https://img.example/new.jpg" } },
        },
      },
      {
        id: { videoId: "other" },
        snippet: { title: "Every Touchdown of Week 13", publishedAt: "2026-12-01T00:00:00Z" },
      },
    ],
  },
  3
);
assert.equal(picked?.videoId, "new");
assert.equal(picked?.thumbUrl, "https://img.example/new.jpg");

async function verifyTouchdownSearch() {
  let fetches = 0;
  const missed = await findWeekTouchdownVideo(3, {
    apiKey: "",
    fetchImpl: async () => {
      fetches += 1;
      throw new Error("should not fetch");
    },
  });
  assert.equal(missed, null);
  assert.equal(fetches, 0);
  const failed = await findWeekTouchdownVideo(3, {
    apiKey: "test-key",
    fetchImpl: async () => new Response("nope", { status: 403 }),
  });
  assert.equal(failed, null);
  let searched = "";
  const found = await findWeekTouchdownVideo(3, {
    apiKey: "test-key",
    seasonYear: 2026,
    fetchImpl: async (input) => {
      searched = String(input);
      return new Response(
        JSON.stringify({
          items: [
            {
              id: { videoId: "td1" },
              snippet: {
                title: "Every Touchdown of Week 3 | 2026",
                publishedAt: "2026-09-23T16:00:00Z",
                thumbnails: { high: { url: "https://img.example/td.jpg" } },
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    },
  });
  assert.equal(found?.videoId, "td1");
  assert.match(searched, /channelId=UCDVYQ4Zhbm3S2dlz7P1GBDg/);
  assert.equal(searched.includes(YT_NFL), true);
  assert.match(searched, /publishedAfter=2026-08-01/);
  assert.match(searched, /key=test-key/);
  console.log("PASS  touchdown search");
}

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
assert.match(send, /findWeekTouchdownVideo/);
const dispatch = readFileSync("src/lib/notify-dispatch.ts", "utf8");
assert.match(dispatch, /\$\{opts\.dedupeKey\}:\$\{plan\.channel\}/);
const cron = readFileSync("src/app/api/cron/week-wrap/route.ts", "utf8");
assert.match(cron, /cronAuthorized/);
assert.match(cron, /runDueWeekWraps/);
const run = readFileSync("src/lib/week-wrap-run.ts", "utf8");
assert.match(run, /syncWeekScoresFromEspn/);
assert.match(readFileSync("src/lib/week-wrap-send.ts", "utf8"), /syncWeekScoresFromEspn/);
const vercel = readFileSync("vercel.json", "utf8");
assert.match(
  vercel,
  /"path": "\/api\/cron\/week-wrap",\s*"schedule": "0 16 \* \* \*"/
);
assert.match(
  vercel,
  /"path": "\/api\/cron\/week-wrap",\s*"schedule": "0 17 \* \* \*"/
);
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

verifyTouchdownSearch()
  .then(() => {
    console.log("\nverify-week-wrap OK");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
