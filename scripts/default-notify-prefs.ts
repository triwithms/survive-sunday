/**
 * One-time User.notifyPref defaults. Safe to re-run.
 *
 *   npx tsx scripts/default-notify-prefs.ts
 *
 * Has email → email. Phone-only or neither → none (never auto-opt into SMS).
 */
import { PrismaClient } from "@prisma/client";
import { prismaDatasourceUrl } from "../src/lib/prisma-url";
import { ensureUserNotifyPref } from "../src/lib/notify-pref-schema";

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL unset");
    process.exit(1);
  }
  const url = prismaDatasourceUrl(raw) ?? raw;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const counts = await ensureUserNotifyPref(prisma);
    console.log(
      `[notify-pref] backfill email=${counts.email} none_phone=${counts.nonePhone} none_neither=${counts.noneNeither} already=${counts.alreadySet}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
