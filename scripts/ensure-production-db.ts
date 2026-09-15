/**
 * Vercel build helper: sync Prisma schema, patch live roster names, seed if empty.
 *
 *   tsx scripts/ensure-production-db.ts
 *
 * Skips when DATABASE_URL is unset so `next build` still type-checks
 * without a database.
 *
 * Preview + production share one Neon database. Other open PRs may have
 * added columns (mulligan transfer, demo/live mode). `prisma db push`
 * would try to drop those and fail without --accept-data-loss. We never
 * pass that flag — leftover friend data and other-PR columns stay.
 * Closed-PR leftover `TwoFactorChallenge` is safe to drop. If a full
 * push would destroy data, we only add `OtpChallenge` and continue.
 */
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { prismaDatasourceUrl } from "../src/lib/prisma-url";
import { applyCanonicalRosterNames } from "../src/lib/roster-name-patch";
import { restorePendingPracticeEmails } from "../src/lib/pending-practice-email";
import { ensureLiveWeekIsolation } from "../src/lib/week-isolation";
import { ensureWeek2Slate } from "../src/lib/ensure-week-slate";
import { isLiveMode } from "../src/lib/pool-mode";
import { backfillPoolAccessRoles } from "../src/lib/roles-db";
import { ensureDualMembershipIndex } from "../src/lib/membership-schema";
import { ensureNotificationTables } from "../src/lib/notification-schema";
import { ensurePickMirrorColumn } from "../src/lib/pick-mirror-schema";
import { ensurePoolRulesColumns } from "../src/lib/pool-rules-schema";
import { ensureCanonicalLiveSeats } from "../src/lib/live-roster";
import { applyCannoliTempPasswordOneshot } from "../src/lib/oneshot-cannoli-password";
import { clearPlaceholderOdds } from "../src/lib/odds-db";
import { espnTeamLogoUrl } from "../src/lib/espn-teams";

const ABANDONED_TABLES = ["TwoFactorChallenge"];

function schemaPushUrl(): string | undefined {
  const raw =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL;
  if (!raw) return undefined;
  return prismaDatasourceUrl(raw) ?? raw;
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited ${result.status}`);
  }
}

function runCaptured(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(cmd, args, { encoding: "utf8", env });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output) {
    process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
  }
  return { status: result.status ?? 1, output };
}

function isTransientPushError(output: string) {
  return /P1001|P1002|P1017|P4000|can't reach|timed out|timeout|advisory lock|connection/i.test(
    output
  );
}

function isDestructivePushError(output: string) {
  return /accept-data-loss|data loss|you are about to drop|not empty/i.test(
    output
  );
}

function sleep(ms: number) {
  spawnSync("sleep", [String(ms / 1000)]);
}

async function withPrisma<T>(
  url: string,
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function dropAbandonedTables(prisma: PrismaClient) {
  for (const table of ABANDONED_TABLES) {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    console.log(`[ensure-db] dropped leftover ${table} if present`);
  }
}

/** Player seats can also hold Administrator tools (promote) without leaving the board. */
async function ensureMembershipIsAdminColumn(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false
  `);
}

/** Extensible user↔roles table. Shipped: player, administrator. Reserved: watcher. */
async function ensurePoolAccessRoleTable(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PoolAccessRole" (
      "id" TEXT NOT NULL,
      "poolId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PoolAccessRole_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PoolAccessRole_poolId_userId_role_key"
    ON "PoolAccessRole" ("poolId", "userId", "role")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PoolAccessRole_userId_idx"
    ON "PoolAccessRole" ("userId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PoolAccessRole_poolId_role_idx"
    ON "PoolAccessRole" ("poolId", "role")
  `);
  const poolFk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = 'PoolAccessRole_poolId_fkey'
  `;
  if (poolFk.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PoolAccessRole"
        ADD CONSTRAINT "PoolAccessRole_poolId_fkey"
        FOREIGN KEY ("poolId") REFERENCES "Pool"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
  const userFk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = 'PoolAccessRole_userId_fkey'
  `;
  if (userFk.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PoolAccessRole"
        ADD CONSTRAINT "PoolAccessRole_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
  try {
    const n = await backfillPoolAccessRoles(prisma);
    console.log(`[ensure-db] PoolAccessRole ready (backfill ${n} grant rows)`);
  } catch (error) {
    console.warn("[ensure-db] PoolAccessRole backfill skipped", error);
  }
}

async function ensurePoolModeColumn(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'demo'
  `);
}

async function ensureOtpChallengeTable(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "OtpChallenge" (
      "id" TEXT NOT NULL,
      "userId" TEXT,
      "email" TEXT NOT NULL,
      "purpose" TEXT NOT NULL,
      "codeHash" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "destination" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "consumedAt" TIMESTAMP(3),
      "lastSentAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OtpChallenge_email_purpose_createdAt_idx"
    ON "OtpChallenge" ("email", "purpose", "createdAt")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "OtpChallenge_userId_purpose_createdAt_idx"
    ON "OtpChallenge" ("userId", "purpose", "createdAt")
  `);
  const fk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = 'OtpChallenge_userId_fkey'
  `;
  if (fk.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "OtpChallenge"
        ADD CONSTRAINT "OtpChallenge_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
  console.log("[ensure-db] OtpChallenge table ready");
}

async function assertRequiredSchema(prisma: PrismaClient) {
  await prisma.user.findFirst({ select: { id: true } });
  await prisma.pool.findFirst({ select: { id: true } });
  await prisma.otpChallenge.findFirst({ select: { id: true } });
  await prisma.poolAccessRole.findFirst({ select: { id: true } });
  await prisma.notificationPreference.findFirst({ select: { id: true } });
}

function pushSchema(env: NodeJS.ProcessEnv) {
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    console.log(
      `[ensure-db] prisma db push${attempt > 1 ? ` (retry ${attempt})` : ""}`
    );
    const result = runCaptured(
      "npx",
      ["prisma", "db", "push", "--skip-generate"],
      env
    );
    if (result.status === 0) return { ok: true as const, output: result.output };
    if (isDestructivePushError(result.output)) {
      return { ok: false as const, output: result.output, destructive: true };
    }
    if (isTransientPushError(result.output) && attempt < attempts) {
      const waitMs = 2000 * attempt;
      console.warn(`[ensure-db] transient db push error — wait ${waitMs}ms`);
      sleep(waitMs);
      continue;
    }
    return { ok: false as const, output: result.output, destructive: false };
  }
  return { ok: false as const, output: "", destructive: false };
}

async function main() {
  const url = schemaPushUrl();
  if (!url) {
    console.warn("[ensure-db] DATABASE_URL unset — skip schema push / seed");
    return;
  }

  const env = { ...process.env, DATABASE_URL: url };

  await withPrisma(url, async (prisma) => {
    await dropAbandonedTables(prisma);
    // Real-mode PR #10 may not have applied if db push refused to drop
    // leftover OtpChallenge rows. Add the column without touching data.
    await ensurePoolModeColumn(prisma);
    await ensureDualMembershipIndex(prisma);
    await ensureMembershipIsAdminColumn(prisma);
    await ensurePoolRulesColumns(prisma);
    await ensurePoolAccessRoleTable(prisma);
    await ensureNotificationTables(prisma);
    await ensurePickMirrorColumn(prisma);
  });

  const pushed = pushSchema(env);
  if (!pushed.ok) {
    if (pushed.destructive) {
      console.warn(
        "[ensure-db] db push would drop columns/tables from another preview — keeping them and adding OtpChallenge only"
      );
    } else {
      console.warn(
        "[ensure-db] db push failed — trying additive OtpChallenge create so the build can continue"
      );
    }
    await withPrisma(url, async (prisma) => {
      await ensurePoolModeColumn(prisma);
      await ensureDualMembershipIndex(prisma);
      await ensureMembershipIsAdminColumn(prisma);
      await ensurePoolRulesColumns(prisma);
      await ensurePoolAccessRoleTable(prisma);
      await ensureOtpChallengeTable(prisma);
      await ensureNotificationTables(prisma);
      await ensurePickMirrorColumn(prisma);
      await assertRequiredSchema(prisma);
    });
  } else {
    await withPrisma(url, async (prisma) => {
      // db push from `main` (still @@unique) can put the leftover back.
      await ensureDualMembershipIndex(prisma);
      await ensurePoolAccessRoleTable(prisma);
      await ensurePoolRulesColumns(prisma);
      await ensureNotificationTables(prisma);
      await ensurePickMirrorColumn(prisma);
      await assertRequiredSchema(prisma);
    });
  }

  const needsSeed = await withPrisma(url, async (prisma) => {
    const pool = await prisma.pool.findUnique({
      where: { inviteCode: "SUNDAY26" },
    });
    if (pool) {
      const users = await prisma.user.count();
      try {
        const rows = await prisma.team.findMany({
          select: { abbr: true, logoUrl: true },
        });
        let patched = 0;
        for (const row of rows) {
          const wanted = espnTeamLogoUrl(row.abbr);
          if (row.logoUrl === wanted) continue;
          await prisma.team.update({
            where: { abbr: row.abbr },
            data: { logoUrl: wanted },
          });
          patched += 1;
        }
        console.log(
          patched
            ? `[ensure-db] ESPN logoUrl restored (${patched} teams)`
            : "[ensure-db] ESPN logoUrl already canonical"
        );
      } catch (error) {
        console.warn("[ensure-db] ESPN logoUrl restore skipped (build continues)", error);
      }
      try {
        const result = await applyCanonicalRosterNames(prisma, pool.id);
        if (result.updated.length === 0) {
          console.log("[ensure-db] roster real names already canonical");
        } else {
          for (const row of result.updated) {
            console.log(
              `[ensure-db] updated ${row.nickname} realName ${row.from ?? "(empty)"} → ${row.to}`
            );
          }
        }
      } catch (error) {
        console.warn(
          "[ensure-db] roster realName patch skipped (build continues)",
          error
        );
      }
      try {
        const seats = await ensureCanonicalLiveSeats(prisma, pool.id);
        for (const row of seats) {
          if (
            row.createdMembership ||
            row.importedWeek1 ||
            row.mirrorSet ||
            row.convertedPendingEmail
          ) {
            console.log(
              `[ensure-db] live seat ${row.nickname}: created=${row.createdMembership} week1=${row.importedWeek1} mirror=${row.mirrorSet} pendingEmail=${row.convertedPendingEmail}`
            );
          } else {
            console.log(`[ensure-db] live seat ${row.nickname} already present`);
          }
        }
      } catch (error) {
        console.warn(
          "[ensure-db] live roster seats skipped (build continues)",
          error
        );
      }
      try {
        const cannoli = await applyCannoliTempPasswordOneshot(prisma);
        if (cannoli.status === "applied") {
          console.log(
            `[ensure-db] Cannoli Stuffer temp password written for ${cannoli.email} (user ${cannoli.userId})`
          );
        } else if (cannoli.status === "already") {
          console.log("[ensure-db] Cannoli Stuffer temp password one-shot already applied");
        } else {
          console.warn(
            `[ensure-db] Cannoli Stuffer temp password skipped (${cannoli.reason})`
          );
        }
      } catch (error) {
        console.warn(
          "[ensure-db] Cannoli Stuffer temp password one-shot skipped (build continues)",
          error
        );
      }
      try {
        const pending = await restorePendingPracticeEmails(prisma, pool.id);
        if (pending.updated.length === 0) {
          console.log("[ensure-db] pending practice emails already restored");
        } else {
          for (const row of pending.updated) {
            console.log(
              `[ensure-db] restored ${row.nickname ?? "seat"} ${row.from} → ${row.to}`
            );
          }
        }
        for (const row of pending.skipped) {
          console.warn(
            `[ensure-db] skipped pending email ${row.email} (${row.reason})`
          );
        }
      } catch (error) {
        console.warn(
          "[ensure-db] pending practice email restore skipped (build continues)",
          error
        );
      }
      try {
        const slate = await ensureWeek2Slate(prisma, pool.id);
        console.log(
          `[ensure-db] Week 2 slate ${slate.changed ? "restored" : "ok"} — ${slate.gameCount} games, lock ${slate.lockAt}`
        );
        if (isLiveMode(pool.mode)) {
          const isolation = await ensureLiveWeekIsolation(prisma, pool);
          if (isolation.changed) {
            console.log(
              `[ensure-db] live pool on Week ${isolation.currentWeek} (Week 2 slate kept)`
            );
          } else {
            console.log("[ensure-db] live pool already on Week 1; Week 2 visible");
          }
        }
      } catch (error) {
        console.warn(
          "[ensure-db] Week 2 slate / live week isolation skipped (build continues)",
          error
        );
      }
      try {
        const cleared = await clearPlaceholderOdds(prisma);
        console.log(
          `[ensure-db] placeholder fake -3 odds ${cleared ? `cleared (${cleared} games)` : "none"}`
        );
      } catch (error) {
        console.warn(
          "[ensure-db] placeholder odds clear skipped (build continues)",
          error
        );
      }
      // Spectator commissioners (no real picks) stay off the player board
      // after isParticipant was added. Playing commissioners with picks
      // are left on the board.
      let spectatorsMarked = 0;
      try {
        const admins = await prisma.membership.findMany({
          where: { role: "admin", isParticipant: true },
          include: {
            picks: {
              where: { source: { not: "missed" }, NOT: { teamAbbr: "MISS" } },
              take: 1,
            },
          },
        });
        for (const admin of admins) {
          if (admin.picks.length === 0) {
            await prisma.membership.update({
              where: { id: admin.id },
              data: { isParticipant: false },
            });
            spectatorsMarked += 1;
          }
        }
      } catch (error) {
        console.warn(
          "[ensure-db] spectator commissioner mark skipped (build continues)",
          error
        );
      }
      console.log(
        `[ensure-db] demo pool present (${users} users)` +
          (spectatorsMarked
            ? `; marked ${spectatorsMarked} spectator commissioner(s)`
            : "")
      );
      return false;
    }
    return true;
  });
  if (needsSeed) {
    console.log("[ensure-db] no SUNDAY26 pool — running seed");
    run("npx", ["tsx", "prisma/seed.ts"], env);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
