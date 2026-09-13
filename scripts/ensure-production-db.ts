/**
 * Vercel build helper: sync Prisma schema, patch live roster names, seed if empty.
 *
 *   tsx scripts/ensure-production-db.ts
 *
 * Skips when DATABASE_URL is unset so `next build` still type-checks
 * without a database. prisma db push uses the same Neon pooler flags as
 * the app client.
 */
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { prismaDatasourceUrl } from "../src/lib/prisma-url";
import { applyCanonicalRosterNames } from "../src/lib/roster-name-patch";

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited ${result.status}`);
  }
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.warn("[ensure-db] DATABASE_URL unset — skip schema push / seed");
    return;
  }

  const url = prismaDatasourceUrl(raw) ?? raw;
  const env = { ...process.env, DATABASE_URL: url };

  console.log("[ensure-db] prisma db push");
  run("npx", ["prisma", "db", "push", "--skip-generate"], env);

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
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
      console.log(`[ensure-db] demo pool present (${users} users)`);
      return;
    }
  } catch (error) {
    console.error("[ensure-db] pool lookup failed after db push", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  console.log("[ensure-db] no SUNDAY26 pool — running seed");
  run("npx", ["tsx", "prisma/seed.ts"], env);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
