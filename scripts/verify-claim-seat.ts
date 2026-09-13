/**
 * Guards for live-roster claim helpers (no database).
 *
 *   npx tsx scripts/verify-claim-seat.ts
 */
import assert from "node:assert/strict";
import {
  CLAIM_ERRORS,
  decideClaim,
  formatSeatLabel,
  isSeatClaimed,
  seatsFromMemberships,
} from "../src/lib/claim-seat";

assert.equal(formatSeatLabel("Gams", "Robert Gama"), "Gams (Robert Gama)");
assert.equal(formatSeatLabel("Long Snapper", "John Stilo"), "Long Snapper (John Stilo)");
assert.equal(formatSeatLabel("Steve", "Steve"), "Steve");
assert.equal(formatSeatLabel("Colin", null), "Colin");
assert.equal(formatSeatLabel("Colin", "  "), "Colin");

assert.equal(isSeatClaimed("gams@survivesunday.demo"), false);
assert.equal(isSeatClaimed("Gams@SurviveSunday.DEMO"), false);
assert.equal(isSeatClaimed("robert@example.com"), true);
assert.equal(isSeatClaimed(null), false);
assert.equal(isSeatClaimed(""), false);

const seats = seatsFromMemberships([
  {
    id: "admin-1",
    nickname: "Commissioner",
    realName: "Robert Gama",
    role: "admin",
    user: { email: "admin@survivesunday.demo" },
  },
  {
    id: "steve-1",
    nickname: "Steve",
    realName: "Steve Venerus",
    role: "member",
    user: { email: "steve@example.com" },
  },
  {
    id: "gams-1",
    nickname: "Gams",
    realName: "Robert Gama",
    role: "member",
    user: { email: "gams@survivesunday.demo" },
  },
]);

assert.equal(seats.length, 2);
assert.equal(seats[0].nickname, "Gams");
assert.equal(seats[0].label, "Gams (Robert Gama)");
assert.equal(seats[0].claimed, false);
assert.equal(seats[1].nickname, "Steve");
assert.equal(seats[1].claimed, true);
assert.ok(!seats.some((s) => s.nickname === "Commissioner"));

const practice = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "robert@example.com",
  emailOwner: null,
});
assert.deepEqual(practice, { ok: true, action: "convert-practice", userId: "u-gams" });

const already = decideClaim({
  seat: { role: "member", userId: "u-steve", email: "steve@example.com" },
  newEmail: "other@example.com",
  emailOwner: null,
});
assert.equal(already.ok, false);
if (!already.ok) {
  assert.equal(already.status, 409);
  assert.equal(already.error, CLAIM_ERRORS.alreadyClaimed);
}

const commish = decideClaim({
  seat: { role: "admin", userId: "u-admin", email: "admin@survivesunday.demo" },
  newEmail: "robert@example.com",
  emailOwner: null,
});
assert.equal(commish.ok, false);
if (!commish.ok) {
  assert.equal(commish.error, CLAIM_ERRORS.commissionerSeat);
}

const missing = decideClaim({
  seat: null,
  newEmail: "robert@example.com",
  emailOwner: null,
});
assert.equal(missing.ok, false);
if (!missing.ok) assert.equal(missing.error, CLAIM_ERRORS.seatMissing);

const taken = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "taken@example.com",
  emailOwner: { id: "someone-else" },
});
assert.equal(taken.ok, false);
if (!taken.ok) {
  assert.equal(taken.status, 409);
  assert.equal(taken.error, CLAIM_ERRORS.emailTaken);
}

const sameUser = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "robert@example.com",
  emailOwner: { id: "u-gams" },
});
assert.equal(sameUser.ok, true);

const demoEmail = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "gams2@survivesunday.demo",
  emailOwner: null,
});
assert.equal(demoEmail.ok, false);
if (!demoEmail.ok) assert.equal(demoEmail.error, CLAIM_ERRORS.demoEmail);

console.log("verify-claim-seat OK");
