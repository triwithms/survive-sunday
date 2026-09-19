/**
 * Additive notify columns + one-shot type-channel defaults. Safe to re-run.
 *
 *   npx tsx scripts/default-notify-prefs.ts
 */
import { PrismaClient } from "@prisma/client";
import { prismaDatasourceUrl } from "../src/lib/prisma-url";
import { ensureNotificationTables } from "../src/lib/notification-schema";
import { ensureUserNotifyPref } from "../src/lib/notify-pref-schema";
import { ensureTypeChannelPrefs } from "../src/lib/notify-type-schema";

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("DATABASE_URL unset");
    process.exit(1);
  }
  const url = prismaDatasourceUrl(raw) ?? raw;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await ensureNotificationTables(prisma);
    const counts = await ensureUserNotifyPref(prisma);
    await ensureTypeChannelPrefs(prisma);
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
