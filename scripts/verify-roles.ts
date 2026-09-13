/**
 * Guards for Player / Administrator role helpers (no database).
 *
 *   npx tsx scripts/verify-roles.ts
 */
import assert from "node:assert/strict";
import {
  canDemoteAdmin,
  hasRole,
  isAdministrator,
  isKnownPoolRole,
  isPlayerSeat,
  isShippedPoolRole,
  POOL_ROLES,
  RESERVED_POOL_ROLES,
  resolveRoleView,
  SHIPPED_POOL_ROLES,
  uniqueAdminUserIds,
  uniqueUsersWithRole,
} from "../src/lib/roles";
import { inferredGrantsFromMemberships } from "../src/lib/roles-db";

assert.equal(POOL_ROLES.player, "player");
assert.equal(POOL_ROLES.administrator, "administrator");
assert.equal(POOL_ROLES.watcher, "watcher");
assert.deepEqual([...SHIPPED_POOL_ROLES], ["player", "administrator"]);
assert.deepEqual([...RESERVED_POOL_ROLES], ["watcher"]);
assert.equal(isKnownPoolRole("watcher"), true);
assert.equal(isShippedPoolRole("watcher"), false);
assert.equal(isShippedPoolRole("player"), true);
assert.equal(hasRole(["player", "administrator"], POOL_ROLES.administrator), true);
assert.equal(hasRole(["player"], POOL_ROLES.watcher), false);

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

const grants = [
  { userId: "robert", role: POOL_ROLES.administrator },
  { userId: "robert", role: POOL_ROLES.player },
  { userId: "john", role: POOL_ROLES.player },
  { userId: "john", role: POOL_ROLES.administrator },
];
assert.deepEqual(
  uniqueUsersWithRole(grants, POOL_ROLES.administrator).sort(),
  ["john", "robert"]
);
assert.equal(canDemoteAdmin(twoAdmins, "john", grants), true);
assert.equal(
  canDemoteAdmin(spectatorAndPlayer, "robert", [
    { userId: "robert", role: POOL_ROLES.administrator },
  ]),
  false
);

assert.equal(
  resolveRoleView({ isPlayer: true, isAdmin: true, requested: undefined }),
  "player"
);
assert.equal(
  resolveRoleView({
    roles: [POOL_ROLES.player, POOL_ROLES.administrator],
    requested: "admin",
  }),
  "admin"
);
assert.equal(
  resolveRoleView({ roles: [POOL_ROLES.administrator], requested: "player" }),
  "admin"
);
assert.equal(
  resolveRoleView({ roles: [POOL_ROLES.player], requested: "admin" }),
  "player"
);
assert.equal(
  resolveRoleView({
    roles: [POOL_ROLES.watcher, POOL_ROLES.administrator],
    requested: undefined,
  }),
  "admin"
);

const inferred = inferredGrantsFromMemberships([
  {
    poolId: "p1",
    userId: "robert",
    role: "admin",
    isAdmin: false,
  },
  {
    poolId: "p1",
    userId: "robert",
    role: "member",
    isAdmin: true,
  },
  {
    poolId: "p1",
    userId: "john",
    role: "member",
    isAdmin: false,
  },
]);
assert.deepEqual(
  inferred
    .map((row) => `${row.userId}:${row.role}`)
    .sort(),
  ["john:player", "robert:administrator", "robert:player"]
);

console.log("verify-roles: ok");
