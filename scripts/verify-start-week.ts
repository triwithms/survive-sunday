/**
 * Late-start pools. No database.
 *   npx tsx scripts/verify-start-week.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allowedEnterPickWeeks } from "../src/lib/enter-pick-week";
import { seatsMissingPick } from "../src/lib/missing-pick-who";
import {
  isPlayerPickWeek,
  resolvePlayerPickWeek,
} from "../src/lib/next-week-picks";
import { nextPlayingWeek, shouldApplyMissedPick } from "../src/lib/pool-rules";
import {
  earliestPlayableWeek,
  futureStartWeekChoices,
  leaderboardWeekChip,
  mulliganAppliesFrom,
  mulliganBeforePoolStart,
  parseStartWeekChoice,
  pickBeforePoolStartError,
  picksOpenAtForStart,
  poolStartBanner,
  quietLeaderboardPage,
  seatPlayingFromWeek,
  weekCountsForPool,
  weeksFromPoolStart,
} from "../src/lib/pool-start-week";

const playing = {
  isParticipant: true,
  status: "undefeated",
  role: "member",
  playingFromWeek: null as number | null,
};

function assertNoLossesBeforeStart() {
  for (let week = 1; week <= 5; week += 1) {
    assert.equal(
      shouldApplyMissedPick(playing, week, 6),
      false,
      `no missed-pick loss in week ${week}`
    );
    assert.equal(weekCountsForPool(6, week), false);
  }
  assert.equal(shouldApplyMissedPick(playing, 6, 6), true);
  assert.equal(weekCountsForPool(6, 18), true);
  assert.equal(
    shouldApplyMissedPick(playing, 3),
    true,
    "family pool still records a missed pick"
  );
  assert.equal(shouldApplyMissedPick(playing, 3, null), true);
  assert.equal(
    shouldApplyMissedPick(
      { ...playing, playingFromWeek: 4 },
      2
    ),
    false,
    "late join still skips earlier weeks"
  );
}

function assertPickApi() {
  assert.match(pickBeforePoolStartError(6, 5) ?? "", /Week 6/);
  assert.equal(pickBeforePoolStartError(6, 6), null);
  assert.equal(pickBeforePoolStartError(null, 1), null);
  const waiting = resolvePlayerPickWeek({
    poolCurrentWeek: 4,
    currentWeekLocked: false,
    existingCurrentPick: null,
    existingCurrentGame: null,
    playingFromWeek: 6,
    nextWeekHasGames: true,
    nextWeekLocked: false,
    now: new Date("2026-10-01T16:00:00.000Z"),
  });
  assert.equal(waiting.actionWeek, 6);
  assert.equal(waiting.nextWeekOpen, false);
  assert.equal(isPlayerPickWeek(waiting, 5), false);
  assert.equal(isPlayerPickWeek(waiting, 4), false);
  const oneWeekLate = resolvePlayerPickWeek({
    poolCurrentWeek: 1,
    currentWeekLocked: true,
    existingCurrentPick: null,
    existingCurrentGame: null,
    playingFromWeek: 2,
    nextWeekHasGames: true,
    nextWeekLocked: false,
    now: new Date("2026-09-13T16:00:00.000Z"),
  });
  assert.equal(oneWeekLate.actionWeek, 2);
  assert.equal(oneWeekLate.nextWeekOpen, true);
  assert.equal(oneWeekLate.reason, "late_start");
}

function assertSeats() {
  assert.equal(seatPlayingFromWeek({ startWeek: 6, lateJoinWeek: 4 }), 6);
  assert.equal(seatPlayingFromWeek({ startWeek: 6, lateJoinWeek: 9 }), 9);
  assert.equal(seatPlayingFromWeek({ startWeek: 6, lateJoinWeek: null }), 6);
  assert.equal(
    seatPlayingFromWeek({ startWeek: null, lateJoinWeek: null }),
    null,
    "family seat with no late join stays unstamped"
  );
  assert.equal(seatPlayingFromWeek({ startWeek: null, lateJoinWeek: 4 }), 4);
  assert.equal(seatPlayingFromWeek({ startWeek: 1, lateJoinWeek: null }), null);
}

function assertNavRemindersWrap() {
  const weeks = [1, 2, 3, 4, 5, 6, 7].map((number) => ({ number }));
  assert.deepEqual(
    weeksFromPoolStart(weeks, 6).map((week) => week.number),
    [6, 7]
  );
  assert.equal(weeksFromPoolStart(weeks, null).length, weeks.length);
  assert.equal(leaderboardWeekChip(3, 6, "Week 3"), null);
  assert.equal(leaderboardWeekChip(3, null, "Week 3"), "Week 3");
  assert.equal(leaderboardWeekChip(6, 6, "Week 6"), "Week 6");
  const seat = {
    membershipId: "m",
    nickname: "Pat",
    status: "undefeated",
    role: "member",
    isParticipant: true,
    playingFromWeek: null,
    userId: "u",
    email: "pat@example.com",
    phoneE164: null,
    notifyPref: "email",
  };
  assert.deepEqual(seatsMissingPick([seat], 3, new Set(), 6), []);
  assert.equal(seatsMissingPick([seat], 3, new Set(), null).length, 1);
  assert.equal(seatsMissingPick([seat], 6, new Set(), 6).length, 1);
  const games = [
    {
      id: "g",
      awayAbbr: "BUF",
      homeAbbr: "MIA",
      status: "scheduled",
      kickoff: new Date("2026-10-20T00:00:00.000Z"),
    },
  ];
  const allowed = allowedEnterPickWeeks({
    currentWeek: 4,
    startWeek: 6,
    weeks: [1, 2, 3, 4, 5, 6].map((number) => ({
      number,
      locked: number < 4,
      games,
    })),
    member: { playingFromWeek: 6, picks: [] },
  });
  assert.ok(allowed.every((week) => week >= 6));
}

function assertFamilyUnchanged() {
  assert.equal(weekCountsForPool(null, 1), true);
  assert.equal(weekCountsForPool(undefined, 8), true);
  const openAt = new Date("2026-10-08T00:20:00.000Z");
  assert.equal(
    poolStartBanner({
      startWeek: null,
      poolCurrentWeek: 3,
      canPickStartWeek: false,
      picksOpenAt: openAt,
    }),
    null
  );
}

function assertMulligan() {
  assert.equal(mulliganBeforePoolStart(5, 6), true);
  assert.equal(mulliganBeforePoolStart(6, 6), false);
  assert.equal(mulliganBeforePoolStart(1, null), false);
  assert.equal(mulliganAppliesFrom(1, 6), 6);
  assert.equal(mulliganAppliesFrom(null, 6), null);
  assert.equal(mulliganAppliesFrom(8, 6), 8);
}

function assertChoicesAndBanner() {
  const now = new Date("2026-10-15T20:00:00.000Z");
  const future = new Date("2026-10-20T00:00:00.000Z");
  const past = new Date("2026-10-01T00:00:00.000Z");
  assert.equal(
    earliestPlayableWeek({
      currentWeek: 6,
      weeks: [{ number: 6, games: [{ kickoff: future, status: "scheduled" }] }],
      now,
    }),
    6
  );
  assert.equal(
    earliestPlayableWeek({
      currentWeek: 6,
      weeks: [{ number: 6, games: [{ kickoff: past, status: "final" }] }],
      now,
    }),
    7
  );
  assert.equal(
    earliestPlayableWeek({
      currentWeek: 18,
      weeks: [{ number: 18, games: [{ kickoff: past, status: "final" }] }],
      now,
    }),
    null
  );
  const choices = futureStartWeekChoices(6);
  assert.deepEqual(choices, Array.from({ length: 13 }, (_, i) => i + 6));
  assert.equal(parseStartWeekChoice(6, choices), 6);
  assert.equal(parseStartWeekChoice(3, choices), undefined);
  assert.equal(parseStartWeekChoice(19, choices), undefined);
  const openAt = picksOpenAtForStart(6, [
    { number: 5, games: [{ kickoff: future }] },
    { number: 6, games: [{ kickoff: new Date("2026-10-22T00:00:00.000Z") }] },
  ]);
  assert.equal(openAt?.toISOString(), future.toISOString());
  const banner = poolStartBanner({
    startWeek: 6,
    poolCurrentWeek: 4,
    canPickStartWeek: false,
    picksOpenAt: openAt,
  });
  assert.match(banner ?? "", /^This pool starts Week 6\. Picks open /);
  assert.equal(
    poolStartBanner({
      startWeek: 6,
      poolCurrentWeek: 5,
      canPickStartWeek: true,
      picksOpenAt: openAt,
    }),
    null
  );
}

function populatedBoard() {
  return {
    rows: [{ id: "a", nickname: "Pat" }],
    heading: {
      weekLabel: "Week 4",
      stillInCount: 8,
      undefeatedCount: 6,
      eliminatedCount: 2,
      pickRowCount: 8,
      lockLine: "Lock: Thu",
      sortLine: "Season race: still in, then out.",
      cta: { href: "/pick", label: "Pick" },
    },
    tiebreak: {
      soleNickname: "Pat",
      sharedNicknames: ["Sam"],
      showNoOfficial: true,
    },
  };
}

function assertLeaderboardQuiet() {
  const banner = "This pool starts Week 6. Picks open Thu, Oct 8.";
  const quiet = quietLeaderboardPage(populatedBoard(), {
    startWeek: 6,
    viewedWeek: 4,
    banner,
  });
  assert.deepEqual(quiet.rows, []);
  assert.equal(quiet.startNotice, banner);
  assert.equal(quiet.heading.lockLine, banner);
  assert.equal(quiet.heading.weekLabel, "Week 6");
  assert.equal(quiet.heading.stillInCount, 0);
  assert.equal(quiet.heading.undefeatedCount, 0);
  assert.equal(quiet.heading.eliminatedCount, 0);
  assert.equal(quiet.heading.pickRowCount, 0);
  assert.equal(quiet.heading.sortLine, "");
  assert.equal(quiet.heading.cta, null);
  assert.equal(quiet.tiebreak.soleNickname, null);
  assert.deepEqual(quiet.tiebreak.sharedNicknames, []);
  assert.equal(quiet.tiebreak.showNoOfficial, false);

  const picksOpen = quietLeaderboardPage(populatedBoard(), {
    startWeek: 6,
    viewedWeek: 5,
    banner: null,
  });
  assert.deepEqual(picksOpen.rows, []);
  assert.equal(picksOpen.tiebreak.soleNickname, null);
  assert.match(picksOpen.startNotice ?? "", /Week 6/);
  assert.match(picksOpen.startNotice ?? "", /Earlier weeks do not count/);

  const started = quietLeaderboardPage(populatedBoard(), {
    startWeek: 6,
    viewedWeek: 6,
    banner: null,
  });
  assert.equal(started.rows.length, 1);
  assert.equal(started.tiebreak.soleNickname, "Pat");
  assert.equal(started.heading.stillInCount, 8);
  assert.equal(started.startNotice, null);

  const family = quietLeaderboardPage(populatedBoard(), {
    startWeek: null,
    viewedWeek: 4,
    banner: "This pool starts Week 6. Picks open soon.",
  });
  assert.equal(family.rows.length, 1);
  assert.equal(family.tiebreak.soleNickname, "Pat");
  assert.deepEqual(family.tiebreak.sharedNicknames, ["Sam"]);
  assert.equal(family.heading.stillInCount, 8);
  assert.equal(family.heading.lockLine, "Lock: Thu");
  assert.equal(family.startNotice, null);
}

function assertAdminOnlySeat() {
  assert.equal(
    seatPlayingFromWeek({
      startWeek: 6,
      lateJoinWeek: nextPlayingWeek({ currentWeek: 4, weekLocked: false }),
    }),
    6,
    "administrator-only seat waits for the pool's first week"
  );
  assert.equal(
    seatPlayingFromWeek({
      startWeek: 6,
      lateJoinWeek: nextPlayingWeek({ currentWeek: 8, weekLocked: true }),
    }),
    9,
    "a later late-join week still wins"
  );
  assert.equal(
    seatPlayingFromWeek({
      startWeek: null,
      lateJoinWeek: nextPlayingWeek({ currentWeek: 4, weekLocked: true }),
    }),
    5,
    "family pool keeps the late-join week only"
  );
  assert.equal(
    seatPlayingFromWeek({
      startWeek: null,
      lateJoinWeek: nextPlayingWeek({ currentWeek: 3, weekLocked: false }),
    }),
    3
  );
  const transfer = readFileSync(
    "src/app/api/admin/transfer-commissioner/route.ts",
    "utf8"
  );
  assert.match(transfer, /outgoingPlayerSeat\.playingFromWeek/);
  assert.match(transfer, /seatPlayingFromWeek\(\{[\s\S]*?startWeek:\s*admin\.membership\.pool\.startWeek/);
  assert.match(
    transfer,
    /lateJoinWeek:\s*nextPlayingWeek\(\{\s*currentWeek,\s*weekLocked\s*\}\)/
  );
  assert.doesNotMatch(transfer, /["'`][^"'`]*Commissioner[^"'`]*["'`]/);
}

function assertWiring() {
  const read = (path: string) => readFileSync(path, "utf8");
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /startWeek\s+Int\?/);
  const sql = read("prisma/migrations/20260929220000_pool_start_week/migration.sql");
  assert.match(sql, /ADD COLUMN IF NOT EXISTS "startWeek"/);
  const statements = sql.replace(/--.*$/gm, "");
  assert.doesNotMatch(statements, /^\s*(UPDATE|DELETE|DROP|TRUNCATE)\b/im);
  for (const path of [
    "src/lib/create-pool.ts",
    "src/lib/add-user-db.ts",
    "src/lib/pool-invite-join.ts",
    "src/lib/claim-seat-db.ts",
    "src/app/api/admin/transfer-commissioner/route.ts",
  ]) {
    assert.match(read(path), /seatPlayingFromWeek/, path);
  }
  assert.match(read("src/lib/create-pool.ts"), /startWeek: chosen/);
  assert.doesNotMatch(
    read("src/lib/create-pool.ts"),
    /usedTeamsJson:\s*[^,\n]*usedTeams/
  );
  assert.match(read("src/lib/pick-submit-week.ts"), /pickBeforePoolStartError/);
  assert.match(read("src/lib/grading.ts"), /week\.pool\.startWeek/);
  assert.match(read("src/lib/missing-pick-load.ts"), /weekCountsForPool/);
  assert.match(read("src/lib/week-wrap-run.ts"), /weekCountsForPool/);
  assert.match(read("src/lib/week-wrap-load.ts"), /weekCountsForPool/);
  assert.match(read("src/components/features/home/load-home.ts"), /weeksFromPoolStart/);
  assert.match(read("src/components/features/pick/load-pick.ts"), /weeksFromPoolStart/);
  assert.match(read("src/app/api/admin/pool-rules/route.ts"), /mulliganBeforePoolStart/);
  assert.match(read("src/components/features/account/CreatePoolStartWeek.tsx"), /First week/);
  assert.match(read(".github/workflows/verify.yml"), /verify:start-week/);
  assert.match(read("src/components/features/help/HelpRules.tsx"), /Weeks before that first week/);
  assert.match(read("src/components/features/help/HelpForAdmins.tsx"), /first/);
  const board = read("src/components/features/board/load-board.ts");
  assert.match(board, /return quietLeaderboardPage\(page,/);
  assert.doesNotMatch(board, /page\.heading\.lockLine = startNotice/);
  const screen = read("src/components/features/board/BoardScreen.tsx");
  assert.match(screen, /data-testid="pool-start-banner"/);
  assert.match(screen, /if \(startNotice\)/);
  assert.doesNotMatch(screen, /Commissioner/);
}

assertNoLossesBeforeStart();
assertPickApi();
assertSeats();
assertNavRemindersWrap();
assertFamilyUnchanged();
assertMulligan();
assertChoicesAndBanner();
assertLeaderboardQuiet();
assertAdminOnlySeat();
assertWiring();
console.log("verify-start-week: ok");
