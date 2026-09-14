/**
 * Commissioner temporary-password checks stay deterministic (no DB writes).
 *
 *   npx tsx scripts/verify-admin-set-password.ts
 */
import {
  ADMIN_SET_PASSWORD_AUDIT,
  checkSetMemberPassword,
  TEMP_PASSWORD_MIN,
} from "../src/lib/admin-set-password";
import {
  CANNOLI_NICKNAME,
  CANNOLI_ONESHOT_AUDIT,
  CANNOLI_TEMP_PASSWORD,
} from "../src/lib/oneshot-cannoli-password";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  assert(ADMIN_SET_PASSWORD_AUDIT === "member_temp_password_set", "audit name");
  assert(TEMP_PASSWORD_MIN === 6, "min length matches Join");

  const claimed = {
    id: "mem_cannoli",
    nickname: "Cannoli Stuffer",
    role: "member",
    email: "mike.frigo@example.com",
  };

  const ok = checkSetMemberPassword({
    membershipId: "mem_cannoli",
    confirmNickname: "cannoli stuffer",
    password: "Sunday-4821KQ",
    member: claimed,
  });
  assert(ok.ok && ok.nickname === "Cannoli Stuffer", "claimed + nickname match");
  assert(ok.ok && ok.email === "mike.frigo@example.com", "email kept");

  const unclaimed = checkSetMemberPassword({
    membershipId: "mem_cannoli",
    confirmNickname: "Cannoli Stuffer",
    password: "Sunday-4821KQ",
    member: {
      ...claimed,
      email: "cannoli-stuffer@survivesunday.demo",
    },
  });
  assert(!unclaimed.ok && /Join link/.test(unclaimed.error), unclaimed.error);

  const spectator = checkSetMemberPassword({
    membershipId: "mem_admin",
    confirmNickname: "Commissioner",
    password: "Sunday-4821KQ",
    member: {
      id: "mem_admin",
      nickname: "Commissioner",
      role: "admin",
      email: "robertgama@gmail.com",
    },
  });
  assert(!spectator.ok && /spectator/.test(spectator.error), spectator.error);

  const typo = checkSetMemberPassword({
    membershipId: "mem_cannoli",
    confirmNickname: "Cannoli",
    password: "Sunday-4821KQ",
    member: claimed,
  });
  assert(!typo.ok && /Cannoli Stuffer/.test(typo.error), typo.error);

  const short = checkSetMemberPassword({
    membershipId: "mem_cannoli",
    confirmNickname: "Cannoli Stuffer",
    password: "ab",
    member: claimed,
  });
  assert(!short.ok && /at least 6/.test(short.error), short.error);

  const missing = checkSetMemberPassword({
    membershipId: "mem_missing",
    confirmNickname: "Cannoli Stuffer",
    password: "Sunday-4821KQ",
    member: null,
  });
  assert(!missing.ok && /couldn’t find/i.test(missing.error), missing.error);

  assert(CANNOLI_NICKNAME === "Cannoli Stuffer", "oneshot nickname");
  assert(CANNOLI_TEMP_PASSWORD === "Cannoli1!", "oneshot password");
  assert(
    CANNOLI_ONESHOT_AUDIT === "oneshot_cannoli_temp_password_20260914",
    "oneshot audit"
  );

  console.log("verify-admin-set-password OK");
}

main();
