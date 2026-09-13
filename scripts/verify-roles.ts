/**
 * Guards for Player / Administrator role helpers (no database).
 *
 *   npx tsx scripts/verify-roles.ts
 */
import assert from "node:assert/strict";
import {
  canDemoteAdmin,
  isAdministrator,
  isPlayerSeat,
  resolveRoleView,
  uniqueAdminUserIds,
} from "../src/lib/roles";

assert.equal(isPlayerSeat({ role: "member" }), true);
assert.equal(isPlayerSeat({ role: "admin" }), false);
assert.equal(isAdministrator({ role: "admin", isAdmin: false }), true);
assert.equal(isAdministrator({ role: "member", isAdmin: true }), true);
assert.equal(isAdministrator({ role: "member", isAdmin: false }), false);

const spectatorAndPlayer = [
  { role: "admin", isAdmin: false, userId: "robert" },
  { role: "member", isAdmin: true, userId: "robert" },
  { role: "member", isAdmin: false, userId: "john" },
];
assert.deepEqual(uniqueAdminUserIds(spectatorAndPlayer), ["robert"]);
assert.equal(canDemoteAdmin(spectatorAndPlayer, "robert"), false);
assert.equal(canDemoteAdmin(spectatorAndPlayer, "john"), false);

const twoAdmins = [
  ...spectatorAndPlayer,
  { role: "member", isAdmin: true, userId: "john" },
];
assert.deepEqual(uniqueAdminUserIds(twoAdmins).sort(), ["john", "robert"]);
assert.equal(canDemoteAdmin(twoAdmins, "john"), true);
assert.equal(canDemoteAdmin(twoAdmins, "robert"), true);

assert.equal(
  resolveRoleView({ isPlayer: true, isAdmin: true, requested: undefined }),
  "player"
);
assert.equal(
  resolveRoleView({ isPlayer: true, isAdmin: true, requested: "admin" }),
  "admin"
);
assert.equal(
  resolveRoleView({ isPlayer: false, isAdmin: true, requested: "player" }),
  "admin"
);
assert.equal(
  resolveRoleView({ isPlayer: true, isAdmin: false, requested: "admin" }),
  "player"
);

console.log("verify-roles: ok");
