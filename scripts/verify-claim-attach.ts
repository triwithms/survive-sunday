/**
 * Attach-to-existing claim: same password path as /login authorize().
 *
 *   npx tsx scripts/verify-claim-attach.ts
 */
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import {
  normalizeAuthEmail,
  normalizeAuthPassword,
  passwordsMatch,
  safeAuthCallbackPath,
  shouldSkipClaimPassword,
} from "../src/lib/auth-credentials";
import { CLAIM_ERRORS, decideClaim } from "../src/lib/claim-seat";
import { userFromCredentials } from "../src/lib/credentials-user";
import {
  ensureDualMembershipIndex,
  isMembershipUserUniqueError,
  isUserEmailUniqueError,
  membershipUserUniqueExists,
} from "../src/lib/membership-schema";

assert.equal(normalizeAuthEmail("  RobertGama@Gmail.com "), "robertgama@gmail.com");
assert.equal(normalizeAuthPassword("  AttachPass9!  "), "AttachPass9!");
assert.equal(normalizeAuthPassword("AttachPass9!\n"), "AttachPass9!");
assert.equal(normalizeAuthPassword("AttachPass9!\r\n"), "AttachPass9!");
assert.equal(normalizeAuthPassword("AttachPass9! "), "AttachPass9!");

assert.equal(safeAuthCallbackPath("/join?seat=abc"), "/join?seat=abc");
assert.equal(safeAuthCallbackPath("/pool"), "/pool");
assert.equal(safeAuthCallbackPath("https://evil.example"), "/pool");
assert.equal(safeAuthCallbackPath("//evil.example"), "/pool");
assert.equal(safeAuthCallbackPath(null), "/pool");

assert.equal(
  shouldSkipClaimPassword({
    sessionUserId: "u-admin",
    sessionEmail: "robertgama@gmail.com",
    ownerUserId: "u-admin",
    claimEmail: "RobertGama@gmail.com",
  }),
  true
);
assert.equal(
  shouldSkipClaimPassword({
    sessionUserId: "u-admin",
    sessionEmail: "other@example.com",
    ownerUserId: "u-admin",
    claimEmail: "robertgama@gmail.com",
  }),
  false
);
assert.equal(
  shouldSkipClaimPassword({
    sessionUserId: undefined,
    ownerUserId: "u-admin",
    claimEmail: "robertgama@gmail.com",
  }),
  false
);

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

assert.equal(
  isMembershipUserUniqueError(
    new Error(
      "Unique constraint failed on the constraint: `Membership_poolId_userId_key`"
    )
  ),
  true
);
assert.equal(
  isMembershipUserUniqueError({
    code: "P2002",
    message: "Unique constraint failed on the fields: (`poolId`,`userId`)",
    meta: { modelName: "Membership", target: ["poolId", "userId"] },
  }),
  true
);
assert.equal(
  isMembershipUserUniqueError(
    new Error("Unique constraint failed on the constraint: `User_email_key`")
  ),
  false
);
assert.equal(
  isUserEmailUniqueError(
    new Error("Unique constraint failed on the constraint: `User_email_key`")
  ),
  true
);
assert.notEqual(
  CLAIM_ERRORS.seatAttachBlocked,
  CLAIM_ERRORS.emailTaken
);

async function main() {
  const password = "CorrectAttach9!";
  const passwordHash = await bcrypt.hash(password, 10);
  const record = {
    id: "u-commish",
    email: "robertgama@gmail.com",
    name: "Commissioner",
    image: null,
    passwordHash,
  };

  const ok = await userFromCredentials(
    "  robertgama@gmail.com ",
    `  ${password}  `,
    async () => record
  );
  assert.equal(ok?.id, "u-commish");

  assert.equal(await passwordsMatch(password, passwordHash), true);
  assert.equal(await passwordsMatch(`${password}\n`, passwordHash), true);
  assert.equal(await passwordsMatch(`${password}\r\n`, passwordHash), true);
  assert.equal(await passwordsMatch(`${password} `, passwordHash), true);
  assert.equal(await passwordsMatch("not-the-password", passwordHash), false);

  const pastedNewline = await userFromCredentials(
    "robertgama@gmail.com",
    `${password}\n`,
    async () => record
  );
  assert.equal(pastedNewline?.id, "u-commish");

  const wrong = await userFromCredentials(
    "robertgama@gmail.com",
    "not-the-password",
    async () => record
  );
  assert.equal(wrong, null);

  if (process.env.DATABASE_URL) {
    const { PrismaClient } = await import("@prisma/client");
    const { joinOrClaimSeat } = await import("../src/lib/claim-seat-db");
    const { INVITE_CODE } = await import("../src/lib/constants");
    const prisma = new PrismaClient();
    const stamp = Date.now().toString(36);
    const adminEmail = `verify-attach-admin-${stamp}@example.com`;
    const nick = `VerifyAttach${stamp}`;
    const practiceEmail = `${nick.toLowerCase()}@survivesunday.demo`;
    try {
      const pool = await prisma.pool.findUnique({
        where: { inviteCode: INVITE_CODE },
      });
      assert.ok(pool, "SUNDAY26 pool required");
      await ensureDualMembershipIndex(prisma);
      assert.equal(
        await membershipUserUniqueExists(prisma),
        false,
        "Membership_poolId_userId_key must be dropped before attach"
      );
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Verify Admin",
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
      await prisma.membership.create({
        data: {
          poolId: pool.id,
          userId: admin.id,
          nickname: `Commish${stamp}`,
          role: "admin",
        },
      });
      const practiceUser = await prisma.user.create({
        data: {
          email: practiceEmail,
          name: nick,
          passwordHash: await bcrypt.hash("demo1234", 10),
        },
      });
      const seat = await prisma.membership.create({
        data: {
          poolId: pool.id,
          userId: practiceUser.id,
          nickname: nick,
          role: "member",
        },
      });

      const bad = await joinOrClaimSeat({
        inviteCode: INVITE_CODE,
        email: adminEmail,
        password: "wrong-password",
        membershipId: seat.id,
      });
      assert.equal(bad.ok, false);
      if (!bad.ok) {
        assert.equal(bad.status, 401);
        assert.equal(bad.error, CLAIM_ERRORS.emailPasswordMismatch);
      }

      // iOS paste often appends \n — Join must accept it the same as Sign in.
      const goodNewline = await joinOrClaimSeat({
        inviteCode: INVITE_CODE,
        email: adminEmail,
        password: `${password}\n`,
        membershipId: seat.id,
      });
      assert.equal(
        goodNewline.ok,
        true,
        goodNewline.ok ? "newline attach ok" : goodNewline.error
      );
      if (goodNewline.ok) {
        const attached = await prisma.membership.findUniqueOrThrow({
          where: { id: seat.id },
        });
        assert.equal(attached.userId, admin.id);
        const dual = await prisma.membership.findMany({
          where: { poolId: pool.id, userId: admin.id },
          select: { id: true, role: true, isAdmin: true },
        });
        assert.equal(dual.length, 2, "commissioner + player seats on one user");
        assert.ok(dual.some((row) => row.role === "admin"));
        assert.ok(dual.some((row) => row.role === "member"));
        const grants = await prisma.poolAccessRole.findMany({
          where: { poolId: pool.id, userId: admin.id },
          select: { role: true },
        });
        const grantRoles = grants.map((g) => g.role).sort();
        assert.ok(grantRoles.includes("player"));
        assert.ok(grantRoles.includes("administrator"));
        assert.equal(await membershipUserUniqueExists(prisma), false);
      }

      const adminSpaceEmail = `verify-attach-space-${stamp}@example.com`;
      const adminSpace = await prisma.user.create({
        data: {
          email: adminSpaceEmail,
          name: "Verify Admin Space",
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
      await prisma.membership.create({
        data: {
          poolId: pool.id,
          userId: adminSpace.id,
          nickname: `CommishSp${stamp}`,
          role: "admin",
        },
      });
      const practiceSpace = await prisma.user.create({
        data: {
          email: `space-${practiceEmail}`,
          name: `${nick}Sp`,
          passwordHash: await bcrypt.hash("demo1234", 10),
        },
      });
      const seatSpace = await prisma.membership.create({
        data: {
          poolId: pool.id,
          userId: practiceSpace.id,
          nickname: `${nick}Sp`,
          role: "member",
        },
      });
      const goodSpace = await joinOrClaimSeat({
        inviteCode: INVITE_CODE,
        email: adminSpaceEmail,
        password: `${password} `,
        membershipId: seatSpace.id,
      });
      assert.equal(
        goodSpace.ok,
        true,
        goodSpace.ok ? "space attach ok" : goodSpace.error
      );
      if (goodSpace.ok) {
        const attachedSpace = await prisma.membership.findUniqueOrThrow({
          where: { id: seatSpace.id },
        });
        assert.equal(attachedSpace.userId, adminSpace.id);
      }

      // Fresh admin-only login: session match skips password (cannot reuse
      // `admin` here — that user already holds a player seat after attach).
      const admin2Email = `verify-attach-admin2-${stamp}@example.com`;
      const admin2 = await prisma.user.create({
        data: {
          email: admin2Email,
          name: "Verify Admin 2",
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
      await prisma.membership.create({
        data: {
          poolId: pool.id,
          userId: admin2.id,
          nickname: `Commish2${stamp}`,
          role: "admin",
        },
      });
      const practice2 = await prisma.user.create({
        data: {
          email: `reset-${practiceEmail}`,
          name: `${nick}B`,
          passwordHash: await bcrypt.hash("demo1234", 10),
        },
      });
      const seat2 = await prisma.membership.create({
        data: {
          poolId: pool.id,
          userId: practice2.id,
          nickname: `${nick}B`,
          role: "member",
        },
      });
      const skipped = await joinOrClaimSeat({
        inviteCode: INVITE_CODE,
        email: admin2Email,
        password: "",
        membershipId: seat2.id,
        sessionUserId: admin2.id,
        sessionEmail: admin2Email,
      });
      assert.equal(skipped.ok, true, skipped.ok ? "skip ok" : skipped.error);
      if (skipped.ok) {
        const attached2 = await prisma.membership.findUniqueOrThrow({
          where: { id: seat2.id },
        });
        assert.equal(attached2.userId, admin2.id);
      }

      const leftoverIds = [
        admin.id,
        admin2.id,
        adminSpace.id,
        practiceUser.id,
        practice2.id,
        practiceSpace.id,
      ];
      await prisma.membership.deleteMany({
        where: { userId: { in: leftoverIds }, poolId: pool.id },
      });
      await prisma.poolAccessRole.deleteMany({
        where: { userId: { in: leftoverIds } },
      });
      await prisma.user.deleteMany({ where: { id: { in: leftoverIds } } });
      console.log("verify-claim-attach integration: ok");
    } finally {
      await prisma.$disconnect();
    }
  } else {
    console.log("verify-claim-attach: skipped DB integration (no DATABASE_URL)");
  }

  console.log("verify-claim-attach: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
