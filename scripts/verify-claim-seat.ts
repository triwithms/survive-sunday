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
assert.equal(isSeatClaimed("jaja@survivesunday.demo"), false);
assert.equal(isSeatClaimed("jaja@pending.survivesunday.local"), false);
assert.equal(isSeatClaimed("go-giants@pending.survivesunday.local"), false);
assert.equal(isSeatClaimed("the-boss@pending.survivesunday.local"), false);
assert.equal(isSeatClaimed("Go-Giants@Pending.SurviveSunday.LOCAL"), false);
assert.equal(isSeatClaimed("robert@example.com"), true);
assert.equal(isSeatClaimed("robertgama@gmail.com"), true);
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
    user: { email: "robertgama@gmail.com" },
  },
  {
    id: "giants-1",
    nickname: "Go Giants",
    realName: "Carson Gama",
    role: "member",
    user: { email: "go-giants@pending.survivesunday.local" },
  },
  {
    id: "pauli-1",
    nickname: "Pauli",
    realName: "Paul Gama",
    role: "member",
    user: { email: "the-boss@pending.survivesunday.local" },
  },
]);

assert.equal(seats.length, 4);
assert.equal(seats[0].nickname, "Gams");
assert.equal(seats[0].label, "Gams (Robert Gama)");
assert.equal(seats[0].claimed, true);
assert.equal(seats[1].nickname, "Go Giants");
assert.equal(seats[1].claimed, false);
assert.equal(seats[2].nickname, "Pauli");
assert.equal(seats[2].claimed, false);
assert.equal(seats[3].nickname, "Steve");
assert.equal(seats[3].claimed, true);
assert.ok(!seats.some((s) => s.nickname === "Commissioner"));

const practice = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "robert@example.com",
  emailOwner: null,
});
assert.deepEqual(practice, { ok: true, action: "convert-practice", userId: "u-gams" });

const pendingPlaceholder = decideClaim({
  seat: {
    role: "member",
    userId: "u-giants",
    email: "go-giants@pending.survivesunday.local",
  },
  newEmail: "carson@example.com",
  emailOwner: null,
});
assert.deepEqual(pendingPlaceholder, {
  ok: true,
  action: "convert-practice",
  userId: "u-giants",
});

const gamsClaimed = decideClaim({
  seat: {
    role: "member",
    userId: "u-gams-real",
    email: "robertgama@gmail.com",
  },
  newEmail: "other@example.com",
  emailOwner: null,
});
assert.equal(gamsClaimed.ok, false);
if (!gamsClaimed.ok) {
  assert.equal(gamsClaimed.status, 409);
  assert.equal(gamsClaimed.error, CLAIM_ERRORS.alreadyClaimed);
}

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
  emailOwner: { id: "someone-else", hasPlayerSeat: true, hasAdminSeat: false },
});
assert.equal(taken.ok, false);
if (!taken.ok) {
  assert.equal(taken.status, 409);
  assert.equal(taken.error, CLAIM_ERRORS.emailOnOtherSeat);
}

const sameUser = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "robert@example.com",
  emailOwner: { id: "u-gams", hasPlayerSeat: true, hasAdminSeat: false },
});
assert.equal(sameUser.ok, true);

const commishEmail = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "robertgama@gmail.com",
  emailOwner: { id: "u-commish", hasPlayerSeat: false, hasAdminSeat: true },
});
assert.deepEqual(commishEmail, {
  ok: true,
  action: "attach-to-existing",
  userId: "u-commish",
});

const demoEmail = decideClaim({
  seat: { role: "member", userId: "u-gams", email: "gams@survivesunday.demo" },
  newEmail: "gams2@survivesunday.demo",
  emailOwner: null,
});
assert.equal(demoEmail.ok, false);
if (!demoEmail.ok) assert.equal(demoEmail.error, CLAIM_ERRORS.demoEmail);

console.log("verify-claim-seat OK");
