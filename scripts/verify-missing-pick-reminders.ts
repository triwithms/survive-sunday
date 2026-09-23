/**
 * Missing-pick reminder rules. No database.
 *
 *   npx tsx scripts/verify-missing-pick-reminders.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PUBLIC_APP_ORIGIN } from "../src/lib/invite-link";
import {
  missingPickChatText,
  remindAfterRecheck,
  seatsMissingPick,
  weekAllowsMissingPickRemind,
  type RemindSeat,
} from "../src/lib/missing-pick-who";

function seat(
  partial: Partial<RemindSeat> & { membershipId: string; nickname: string }
): RemindSeat {
  return {
    status: "undefeated",
    role: "member",
    isParticipant: true,
    playingFromWeek: null,
    userId: partial.membershipId,
    email: null,
    phoneE164: null,
    notifyPref: "both",
    ...partial,
  };
}

function notifiedIds(
  seats: RemindSeat[],
  weekNumber: number,
  picked: ReadonlySet<string>,
  pickExistsNow: (membershipId: string) => boolean
): string[] {
  const blanks = seatsMissingPick(seats, weekNumber, picked);
  const sent: string[] = [];
  for (const row of blanks) {
    if (!remindAfterRecheck(pickExistsNow(row.membershipId))) continue;
    sent.push(row.membershipId);
  }
  return sent;
}

const steve = seat({ membershipId: "steve", nickname: "Steve" });
const pauli = seat({ membershipId: "pauli", nickname: "Pauli" });
const eliminated = seat({
  membershipId: "out",
  nickname: "Out",
  status: "eliminated",
});
const adminSeat = seat({
  membershipId: "admin",
  nickname: "Spectator",
  role: "admin",
});
const late = seat({
  membershipId: "late",
  nickname: "Late",
  playingFromWeek: 5,
});
const spectator = seat({
  membershipId: "watch",
  nickname: "Watcher",
  isParticipant: false,
});

const picked = new Set(["steve"]);
const blanks = seatsMissingPick(
  [steve, pauli, eliminated, adminSeat, late, spectator],
  3,
  picked
);
assert.deepEqual(
  blanks.map((row) => row.membershipId),
  ["pauli"],
  "only the seat with no Pick is blank"
);
assert.equal(remindAfterRecheck(true), false, "existing Pick is never reminded");
assert.equal(remindAfterRecheck(false), true);

const neverSteve = notifiedIds(
  [steve, pauli],
  3,
  picked,
  (id) => id === "steve"
);
assert.deepEqual(neverSteve, ["pauli"]);
assert.ok(!neverSteve.includes("steve"), "membership with Pick is never reminded");

const savedAfterList = notifiedIds(
  [steve, pauli],
  3,
  new Set(),
  (id) => id === "steve" || id === "pauli"
);
assert.deepEqual(savedAfterList, [], "recheck skips a Pick written after the list");

const now = new Date("2026-09-10T16:00:00.000Z");
const soon = new Date("2026-09-11T15:00:00.000Z");
const later = new Date("2026-09-12T16:00:00.000Z");
const past = new Date("2026-09-10T15:00:00.000Z");
assert.equal(
  weekAllowsMissingPickRemind({ mode: "cron", status: "open", lockAt: soon, now }),
  true
);
assert.equal(
  weekAllowsMissingPickRemind({ mode: "cron", status: "open", lockAt: later, now }),
  false,
  "cron keeps the 24h window"
);
assert.equal(
  weekAllowsMissingPickRemind({ mode: "admin", status: "open", lockAt: later, now }),
  true,
  "admin send/list ignores the 24h window"
);
assert.equal(
  weekAllowsMissingPickRemind({ mode: "admin", status: "open", lockAt: past, now }),
  false
);
assert.equal(
  weekAllowsMissingPickRemind({ mode: "admin", status: "locked", lockAt: later, now }),
  false
);

const chat = missingPickChatText({
  weekNumber: 3,
  nicknames: ["Pauli", "Go Giants"],
  appUrl: `${PUBLIC_APP_ORIGIN}/pick`,
});
assert.match(chat, /No Week 3 pick yet/);
assert.match(chat, /https:\/\/survive-sunday\.vercel\.app\/pick/);
assert.ok(chat.indexOf("Go Giants") < chat.indexOf("Pauli"));

const reminders = readFileSync("src/lib/notification-reminders.ts", "utf8");
const recheck = reminders.indexOf("membershipHasPick");
const notify = reminders.indexOf("notifyUser");
assert.ok(recheck >= 0 && recheck < notify, "recheck Pick before notifyUser");
assert.match(reminders, /mode \?\? "cron"/);
assert.match(reminders, /mode === "admin"/);
assert.match(reminders, /writeMissingPickAudit/);
assert.doesNotMatch(reminders, /NOTIFY_MODE/);

const load = readFileSync("src/lib/missing-pick-load.ts", "utf8");
assert.match(load, /prisma\.pick\.findMany/);
assert.match(load, /weekId: week\.id/);
assert.match(load, /findUnique/);
assert.doesNotMatch(load, /picks:\s*true/);
assert.match(load, /mode !== "admin"/);

const cron = readFileSync("src/app/api/cron/missing-pick-reminders/route.ts", "utf8");
assert.match(cron, /sendMissingPickReminders\(\)/);
assert.doesNotMatch(cron, /mode:\s*"admin"/);
assert.doesNotMatch(cron, /isMissingPickReminderWindow/);

const admin = readFileSync("src/app/api/admin/missing-pick-reminders/route.ts", "utf8");
assert.match(admin, /mode:\s*"admin"/);
assert.match(admin, /listAdminMissingPicks/);
assert.doesNotMatch(admin, /isMissingPickReminderWindow/);

const screen = readFileSync("src/components/features/admin/SystemScreen.tsx", "utf8");
assert.match(screen, /MissingPickPanel/);
assert.match(readFileSync("docs/HANDOFF.md", "utf8"), /Missing picks/);
assert.match(readFileSync("docs/FILE-MAP.md", "utf8"), /isMissingPickReminderWindow/);

for (const path of [
  "src/lib/missing-pick-who.ts",
  "src/lib/missing-pick-load.ts",
  "src/lib/missing-pick-list.ts",
  "src/lib/missing-pick-seat.ts",
  "src/lib/missing-pick-audit.ts",
  "src/lib/notification-reminders.ts",
  "src/components/features/admin/MissingPickPanel.tsx",
  "src/components/features/admin/MissingPickWeek.tsx",
  "src/components/features/admin/use-missing-pick.ts",
]) {
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  assert.ok(lines <= 100, `${path} is ${lines} lines`);
}

console.log("verify-missing-pick-reminders OK");
