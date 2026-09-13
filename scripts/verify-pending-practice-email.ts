/**
 * Guards for leftover @pending.survivesunday.local → practice email restore.
 *
 *   npx tsx scripts/verify-pending-practice-email.ts
 */
import assert from "node:assert/strict";
import {
  CLAIMED_GAMS_EMAIL,
  planPendingPracticeRestore,
} from "../src/lib/pending-practice-email";
import { isSeatClaimed } from "../src/lib/claim-seat";
import { practiceEmailFromPlaceholder } from "../src/lib/pool-mode";

assert.equal(CLAIMED_GAMS_EMAIL, "robertgama@gmail.com");

assert.deepEqual(
  planPendingPracticeRestore({
    email: "go-giants@pending.survivesunday.local",
    userId: "u-giants",
  }),
  {
    action: "rename",
    from: "go-giants@pending.survivesunday.local",
    to: "go-giants@survivesunday.demo",
  }
);

assert.deepEqual(
  planPendingPracticeRestore({
    email: "the-boss@pending.survivesunday.local",
    userId: "u-pauli",
  }),
  {
    action: "rename",
    from: "the-boss@pending.survivesunday.local",
    to: "the-boss@survivesunday.demo",
  }
);

assert.equal(
  planPendingPracticeRestore({
    email: "robertgama@gmail.com",
    userId: "u-gams",
  }).action,
  "skip"
);

assert.equal(
  planPendingPracticeRestore({
    email: "gams@survivesunday.demo",
    userId: "u-gams",
  }).action,
  "skip"
);

assert.equal(
  planPendingPracticeRestore({
    email: "go-giants@pending.survivesunday.local",
    userId: "u-giants",
    targetTakenByUserId: "someone-else",
  }).action,
  "skip"
);

assert.deepEqual(
  planPendingPracticeRestore({
    email: "go-giants@pending.survivesunday.local",
    userId: "u-giants",
    targetTakenByUserId: "u-giants",
  }),
  {
    action: "rename",
    from: "go-giants@pending.survivesunday.local",
    to: "go-giants@survivesunday.demo",
  }
);

assert.equal(isSeatClaimed("go-giants@survivesunday.demo"), false);
assert.equal(isSeatClaimed("the-boss@survivesunday.demo"), false);
assert.equal(isSeatClaimed(CLAIMED_GAMS_EMAIL), true);
assert.equal(
  practiceEmailFromPlaceholder("player@staging.survivesunday.local"),
  "player@survivesunday.demo"
);

console.log("verify-pending-practice-email OK");
