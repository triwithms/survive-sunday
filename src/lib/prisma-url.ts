/**
 * Neon’s pooled host needs Prisma’s pgbouncer flag; serverless should
 * keep a single connection per isolate. Applied at PrismaClient init so
 * Auth.js authorize and the rest of the app share one URL.
 */
export function prismaDatasourceUrl(
  raw: string | undefined = process.env.DATABASE_URL
): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const pooled = host.includes("-pooler.") || host.includes("-pooler-");
    if (pooled && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    return raw;
  }
}
