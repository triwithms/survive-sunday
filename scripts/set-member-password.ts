/**
 * Fallback when Admin UI is not reachable: set a claimed member’s password.
 *
 * Never invent a password. You must pass --password (or PASSWORD=).
 * Never commit the password. The audit log stores the nickname, not the secret.
 *
 *   DATABASE_URL=... npx tsx scripts/set-member-password.ts \
 *     --nickname "Cannoli Stuffer" --password 'the-temp-you-will-text'
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { INVITE_CODE } from "../src/lib/constants";
import { isSeatClaimed } from "../src/lib/claim-seat";
import { nicknamesMatch } from "../src/lib/pool-rules";
import { isPlayerSeat } from "../src/lib/roles";
import { maskEmail } from "../src/lib/otp";
import {
  ADMIN_SET_PASSWORD_AUDIT,
  TEMP_PASSWORD_MIN,
  TEMP_PASSWORD_MAX,
} from "../src/lib/admin-set-password";

function arg(name: string): string {
  const envName = name.replace(/^--/, "").toUpperCase().replace(/-/g, "_");
  const envVal = process.env[envName];
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return typeof envVal === "string" ? envVal : "";
}

async function main() {
  const nickname = arg("--nickname").trim();
  const password = arg("--password");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing. This script talks to Neon — do not guess a URL.");
    process.exit(1);
  }
  if (!nickname || !password) {
    console.error(
      'Usage: DATABASE_URL=... npx tsx scripts/set-member-password.ts --nickname "Cannoli Stuffer" --password \'temp-you-will-text\''
    );
    process.exit(1);
  }
  if (password.length < TEMP_PASSWORD_MIN || password.length > TEMP_PASSWORD_MAX) {
    console.error(`Password must be ${TEMP_PASSWORD_MIN}–${TEMP_PASSWORD_MAX} characters.`);
    process.exit(1);
  }

  const db = new PrismaClient();
  try {
    const pool = await db.pool.findUnique({ where: { inviteCode: INVITE_CODE } });
    if (!pool) {
      console.error("Pool SUNDAY26 not found.");
      process.exit(1);
    }
    const members = await db.membership.findMany({
      where: { poolId: pool.id },
      include: { user: { select: { id: true, email: true } } },
    });
    const match = members.find((m) => nicknamesMatch(m.nickname, nickname));
    if (!match) {
      console.error(
        `No seat named "${nickname}". Roster: ${members.map((m) => m.nickname).join(", ")}`
      );
      process.exit(1);
    }
    if (!isPlayerSeat(match)) {
      console.error("That seat is the commissioner spectator, not a player.");
      process.exit(1);
    }
    if (!isSeatClaimed(match.user.email)) {
      console.error(
        `${match.nickname} has not Joined yet (${match.user.email}). Send a personal Join link instead.`
      );
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await db.$transaction([
      db.user.update({
        where: { id: match.user.id },
        data: { passwordHash },
      }),
      db.auditLog.create({
        data: {
          poolId: pool.id,
          actorId: match.user.id,
          action: ADMIN_SET_PASSWORD_AUDIT,
          targetType: "membership",
          targetId: match.id,
          details: JSON.stringify({
            nickname: match.nickname,
            emailMasked: maskEmail(match.user.email),
            note: "Temporary password set via scripts/set-member-password.ts. Password not stored here.",
          }),
        },
      }),
    ]);
    console.log(
      `Saved a temporary password for ${match.nickname} (${maskEmail(match.user.email)}). Text it to them. Do not paste it into GitHub.`
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
