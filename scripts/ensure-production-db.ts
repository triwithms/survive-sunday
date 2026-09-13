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
import { ensureLiveWeekIsolation } from "../src/lib/week-isolation";
import { isLiveMode } from "../src/lib/pool-mode";

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
      await ensureOtpChallengeTable(prisma);
      await assertRequiredSchema(prisma);
    });
  } else {
    await withPrisma(url, assertRequiredSchema);
  }

  const needsSeed = await withPrisma(url, async (prisma) => {
    const pool = await prisma.pool.findUnique({
      where: { inviteCode: "SUNDAY26" },
    });
    if (pool) {
      const users = await prisma.user.count();
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
        if (isLiveMode(pool.mode)) {
          const isolation = await ensureLiveWeekIsolation(prisma, pool);
          if (isolation.changed) {
            console.log(
              `[ensure-db] live pool snapped to Week ${isolation.currentWeek}, cleared ${isolation.clearedPicks} Week 2 picks`
            );
          } else {
            console.log("[ensure-db] live pool already on Week 1");
          }
        }
      } catch (error) {
        console.warn(
          "[ensure-db] live week isolation skipped (build continues)",
          error
        );
      }
      console.log(`[ensure-db] demo pool present (${users} users)`);
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
