import assert from "node:assert/strict";
import { weekNumbersFromDedupeKeys, withSkippedWeek } from "../../src/lib/week-wrap-parse";
import { parseWeekWrapRequest } from "../../src/lib/week-wrap-request";
import { weekWrapClaimKeys } from "../../src/lib/week-wrap-types";
import { DEFAULT_NOTIFICATION_PREFS } from "../../src/lib/notification-types";
import { resolveChannels } from "../../src/lib/notify-channels";

const keys = weekWrapClaimKeys("pool", 2);
assert.equal(keys.base, "wrap:pool:w2");
assert.equal(keys.email, "wrap:pool:w2:email");
assert.equal(keys.sms, "wrap:pool:w2:sms");
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

assert.equal(DEFAULT_NOTIFICATION_PREFS.weekWrap, "email");
assert.deepEqual(resolveChannels({ masterOn: true }, "game", undefined, "weekWrap"), ["email"]);
assert.deepEqual(
  resolveChannels({ masterOn: false, channels: { weekWrap: "email" } }, "game", undefined, "weekWrap"),
  []
);
assert.deepEqual(
  resolveChannels({ masterOn: true, channels: { weekWrap: "off" } }, "game", undefined, "weekWrap"),
  []
);
assert.deepEqual(
  resolveChannels({ masterOn: true, channels: { weekWrap: "both" } }, "game", undefined, "weekWrap"),
  ["email", "sms"]
);
assert.equal(parseWeekWrapRequest({ action: "send", weekNumber: 1, tone: "wild" }).ok, false);
console.log("PASS  weekWrap prefs");
