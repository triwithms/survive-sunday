import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";

export const ENSURE_SCRIPT = "scripts/_dangerous/ensure-production-db.ts";

export function fail(message: string): never {
  console.error(`[verify-ensure-db] ${message}`);
  process.exit(1);
}

export function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(cmd, args, { encoding: "utf8", env });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output) process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
  return { status: result.status ?? 1, output };
}

export async function columnExists(
  prisma: PrismaClient,
  table: string,
  column: string
) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export async function tableExists(prisma: PrismaClient, table: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}
