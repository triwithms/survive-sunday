/**
 * Admin redesign bundle B: roster filters + needs-you sort,
 * record sections, System order, reset on Pool.
 *
 *   npx tsx scripts/verify-admin-bundle-b.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  noticeCounts,
  remindConfirmLine,
  wrapConfirmLine,
} from "../src/lib/notice-audience";
import {
  compareNeedsYou,
  needsYouRank,
  passesRosterFilter,
  rosterEmptyCopy,
  rosterFilterCounts,
  type RosterSortRow,
} from "../src/components/features/admin/roster-needs-you";

function row(partial: Partial<RosterSortRow> & Pick<RosterSortRow, "nickname">): RosterSortRow {
  return {
    id: partial.nickname,
    status: "undefeated",
    hasWeekPick: false,
    ...partial,
  };
}

const noA = row({ nickname: "Amina", status: "undefeated", hasWeekPick: false });
const noB = row({ nickname: "Bo", status: "one_loss", hasWeekPick: false });
const picked = row({ nickname: "Cara", status: "undefeated", hasWeekPick: true });
const channel = row({
  nickname: "Dana",
  status: "one_loss",
  hasWeekPick: true,
  channelNeedsYou: true,
});
const out = row({ nickname: "Eden", status: "eliminated", hasWeekPick: false, channelNeedsYou: true });
const rows = [out, picked, noB, channel, noA];

assert.equal(needsYouRank(noA, true), 0);
assert.equal(needsYouRank(noA, false), 2, "closed week is not the no-pick tier");
assert.equal(needsYouRank(picked, true), 2, "no channel field skips that tier");
assert.equal(needsYouRank(channel, true), 1);
assert.equal(needsYouRank({ ...picked, channelNeedsYou: false }, true), 2);
assert.equal(needsYouRank(out, true), 3);

const sorted = [...rows].sort((a, b) => compareNeedsYou(a, b, true));
assert.deepEqual(
  sorted.map((item) => item.nickname),
  ["Amina", "Bo", "Dana", "Cara", "Eden"]
);

assert.equal(passesRosterFilter(out, "no_pick"), false);
assert.equal(passesRosterFilter(noA, "no_pick"), true);
assert.equal(passesRosterFilter(picked, "no_pick"), false);
assert.equal(passesRosterFilter(noB, "one_loss"), true);
assert.equal(passesRosterFilter(noB, "no_pick"), true);
assert.equal(passesRosterFilter(out, "out"), true);
const counts = rosterFilterCounts(rows);
assert.deepEqual(counts, { all: 5, no_pick: 2, one_loss: 2, out: 1 });
assert.equal(rosterEmptyCopy("no_pick", 3, false), "Everyone has a pick for Week 3.");
assert.equal(rosterEmptyCopy("out", 3, false), "No one is out yet.");
assert.equal(rosterEmptyCopy("all", 3, true), "No one matches that.");

const plan = noticeCounts(
  [
    {
      userId: "1",
      nickname: "Email",
      email: "a@b.com",
      masterOn: true,
      channels: { missingPickReminder: "email" },
    },
    {
      userId: "2",
      nickname: "Both",
      email: "c@d.com",
      phoneE164: "+14165550100",
      masterOn: true,
      channels: { missingPickReminder: "both" },
    },
    {
      userId: "3",
      nickname: "Off",
      email: "e@f.com",
      phoneE164: "+14165550101",
      masterOn: false,
      channels: { missingPickReminder: "both" },
    },
    {
      userId: "4",
      nickname: "TypeOff",
      email: "g@h.com",
      masterOn: true,
      channels: { missingPickReminder: "off" },
    },
    {
      userId: "5",
      nickname: "Demo",
      email: "x@survivesunday.demo",
      masterOn: true,
      channels: { missingPickReminder: "email" },
    },
  ],
  "missingPickReminder"
);
assert.equal(plan.email, 2);
assert.equal(plan.sms, 1);
assert.equal(plan.skippedOff, 2);
assert.deepEqual(plan.nicknames, ["Both", "Email"]);
assert.equal(
  remindConfirmLine(plan),
  "Email 2 · SMS 1 · 2 skipped (notifications off)"
);
assert.equal(
  wrapConfirmLine(3, plan),
  "Send Week 3 wrap to 2 email · 1 SMS now? Auto-send will be cancelled."
);

const system = readFileSync("src/components/features/admin/SystemScreen.tsx", "utf8");
const wrap = system.indexOf("<WeekWrapPanel");
const missing = system.indexOf("<MissingPickPanel");
const enter = system.indexOf("<EnterPickForm");
const test = system.indexOf("<SendTestNotify");
assert.ok(wrap >= 0 && wrap < missing && missing < enter && enter < test);
assert.doesNotMatch(system, /ResetPoolPanel/);

const pool = readFileSync("src/components/features/admin/ConfigScreen.tsx", "utf8");
assert.ok(pool.indexOf("<TransferCommissionerForm") < pool.indexOf("<ResetPoolPanel"));
assert.match(pool, /pool-danger/);
assert.match(readFileSync("src/components/features/admin/ResetPoolConfirm.tsx", "utf8"), /RESET_POOL_CONFIRM/);

const editor = readFileSync("src/components/features/admin/RosterEditor.tsx", "utf8");
assert.match(editor, /RosterFilters/);
assert.match(editor, /writeRosterScroll/);
assert.match(editor, /query/);
assert.match(readFileSync("src/components/features/admin/InviteJoinButtons.tsx", "utf8"), /Copy join link/);
assert.match(readFileSync("src/components/features/admin/UserEditPanel.tsx", "utf8"), /roster-access/);
assert.match(readFileSync("src/components/features/admin/RosterRecordBar.tsx", "utf8"), /Change pick/);
assert.match(readFileSync("src/components/features/admin/RosterRecordBar.tsx", "utf8"), /eliminated/);
assert.doesNotMatch(readFileSync("src/components/features/admin/roster-rows.ts", "utf8"), /channelNeedsYou:\s*true/);

const reminders = readFileSync("src/lib/notification-reminders.ts", "utf8");
assert.match(reminders, /opts\?\.membershipId && seat\.membershipId !== opts\.membershipId/);
assert.match(readFileSync("src/components/features/admin/MissingPickRemind.tsx", "utf8"), /Remind all/);
assert.match(readFileSync("src/components/features/admin/WeekWrapSend.tsx", "utf8"), /Who gets this/);
assert.doesNotMatch(readFileSync("src/components/features/admin/WeekWrapSend.tsx", "utf8"), /email@|phoneE164/);
assert.match(readFileSync("src/components/features/admin/admin-tabs.ts", "utf8"), /label: "System"/);

console.log("verify-admin-bundle-b OK");
