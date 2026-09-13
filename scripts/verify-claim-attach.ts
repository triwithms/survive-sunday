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
  safeAuthCallbackPath,
  shouldSkipClaimPassword,
} from "../src/lib/auth-credentials";
import { CLAIM_ERRORS, decideClaim } from "../src/lib/claim-seat";
import { userFromCredentials } from "../src/lib/credentials-user";

assert.equal(normalizeAuthEmail("  RobertGama@Gmail.com "), "robertgama@gmail.com");
assert.equal(normalizeAuthPassword("  AttachPass9!  "), "AttachPass9!");

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

      const good = await joinOrClaimSeat({
        inviteCode: INVITE_CODE,
        email: adminEmail,
        password,
        membershipId: seat.id,
      });
      assert.equal(good.ok, true);
      if (good.ok) {
        const attached = await prisma.membership.findUniqueOrThrow({
          where: { id: seat.id },
        });
        assert.equal(attached.userId, admin.id);
      }

      const leftover = await prisma.user.findUnique({
        where: { id: practiceUser.id },
      });
      const practice2 = leftover
        ? leftover
        : await prisma.user.create({
            data: {
              email: `reset-${practiceEmail}`,
              name: nick,
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
        email: adminEmail,
        password: "",
        membershipId: seat2.id,
        sessionUserId: admin.id,
        sessionEmail: adminEmail,
      });
      assert.equal(skipped.ok, true);
      if (skipped.ok) {
        const attached2 = await prisma.membership.findUniqueOrThrow({
          where: { id: seat2.id },
        });
        assert.equal(attached2.userId, admin.id);
      }

      await prisma.membership.deleteMany({
        where: { userId: admin.id, poolId: pool.id },
      });
      await prisma.poolAccessRole.deleteMany({ where: { userId: admin.id } });
      await prisma.user.delete({ where: { id: admin.id } }).catch(() => undefined);
      await prisma.user.delete({ where: { id: practice2.id } }).catch(() => undefined);
      await prisma.user.delete({ where: { id: practiceUser.id } }).catch(() => undefined);
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
