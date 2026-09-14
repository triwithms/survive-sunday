/**
 * Pure checks for commissioner mulligan / one-and-done and transfer helpers.
 *   npx tsx scripts/verify-pool-rules.ts
 */
import {
  decideStatusAfterLoss,
  isPoolParticipant,
  isSingleEliminationWeek,
  nextPlayingWeek,
  nicknamesMatch,
  parseSingleEliminationWeek,
  poolRulesPlayerLabel,
  shouldApplyMissedPick,
} from "../src/lib/pool-rules";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function main() {
  assert(!isSingleEliminationWeek(null, 2), "null rule is not one-and-done");
  assert(!isSingleEliminationWeek(5, 4), "week before start is still mulligan");
  assert(isSingleEliminationWeek(5, 5), "start week is one-and-done");
  assert(isSingleEliminationWeek(5, 8), "later week is one-and-done");

  const classic = decideStatusAfterLoss({
    currentStatus: "undefeated",
    mulliganRemaining: true,
    weekNumber: 3,
    singleEliminationFromWeek: null,
  });
  assert(!classic.unchanged && classic.status === "one_loss", "classic first loss");
  assert(classic.burnedMulligan === true, "classic burns mulligan");

  const alreadyUsed = decideStatusAfterLoss({
    currentStatus: "one_loss",
    mulliganRemaining: false,
    weekNumber: 3,
    singleEliminationFromWeek: null,
  });
  assert(
    !alreadyUsed.unchanged && alreadyUsed.status === "eliminated",
    "second loss still eliminates"
  );

  const oneAndDone = decideStatusAfterLoss({
    currentStatus: "undefeated",
    mulliganRemaining: true,
    weekNumber: 5,
    singleEliminationFromWeek: 5,
  });
  assert(
    !oneAndDone.unchanged && oneAndDone.status === "eliminated",
    "unused mulligan does not save in one-and-done week"
  );
  assert(oneAndDone.mulliganRemaining === true, "do not mark unused mulligan as used");
  assert(oneAndDone.burnedMulligan === false, "one-and-done does not burn");

  const stillMulligan = decideStatusAfterLoss({
    currentStatus: "undefeated",
    mulliganRemaining: true,
    weekNumber: 4,
    singleEliminationFromWeek: 5,
  });
  assert(
    !stillMulligan.unchanged && stillMulligan.status === "one_loss",
    "week before the switch still uses mulligan"
  );

  const alreadyOneLoss = decideStatusAfterLoss({
    currentStatus: "one_loss",
    mulliganRemaining: false,
    weekNumber: 6,
    singleEliminationFromWeek: 5,
  });
  assert(
    !alreadyOneLoss.unchanged && alreadyOneLoss.status === "eliminated",
    "people who already used a mulligan still go out on the next loss"
  );

  const dead = decideStatusAfterLoss({
    currentStatus: "eliminated",
    mulliganRemaining: false,
    weekNumber: 6,
    singleEliminationFromWeek: 5,
  });
  assert(dead.unchanged === true, "already out stays out");

  assert(
    poolRulesPlayerLabel(null) === null,
    "no banner while mulligan is on"
  );
  assert(
    poolRulesPlayerLabel(7) === "From Week 7: no mulligan / one-and-done.",
    "player label"
  );

  assert(isPoolParticipant({ isParticipant: true, role: "member" }), "playing admin");
  assert(!isPoolParticipant({ isParticipant: true, role: "admin" }), "spectator seat stays off board");
  assert(!isPoolParticipant({ isParticipant: false, role: "admin" }), "spectator admin");
  assert(!isPoolParticipant({ role: "admin" }), "legacy admin is spectator");
  assert(isPoolParticipant({ role: "member" }), "legacy member plays");
  assert(!isPoolParticipant({ isParticipant: false, role: "member" }), "non-playing member seat");

  assert(
    !shouldApplyMissedPick(
      { isParticipant: false, status: "undefeated" },
      2
    ),
    "spectator skips missed pick"
  );
  assert(
    !shouldApplyMissedPick(
      { isParticipant: true, status: "undefeated", playingFromWeek: 4 },
      2
    ),
    "not yet playing this week"
  );
  assert(
    shouldApplyMissedPick(
      { isParticipant: true, status: "undefeated", playingFromWeek: 2 },
      2
    ),
    "playing from this week"
  );
  assert(
    !shouldApplyMissedPick(
      { isParticipant: true, status: "eliminated" },
      2
    ),
    "eliminated skips missed pick"
  );

  assert(nextPlayingWeek({ currentWeek: 2, weekLocked: false }) === 2, "open week");
  assert(nextPlayingWeek({ currentWeek: 2, weekLocked: true }) === 3, "locked week");

  assert(nicknamesMatch("Gams", "gams"), "nickname case");
  assert(!nicknamesMatch("Gams", "Steve"), "nickname mismatch");

  assert(parseSingleEliminationWeek(null) === null, "parse null");
  assert(parseSingleEliminationWeek(3) === 3, "parse week");
  assert(parseSingleEliminationWeek(0) === undefined, "reject 0");
  assert(parseSingleEliminationWeek(19) === undefined, "reject 19");

  console.log("verify-pool-rules: ok");
}

main();
