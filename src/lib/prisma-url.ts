/**
 * Neon’s pooled host needs Prisma’s pgbouncer flag. Its pooler can safely
 * multiplex a small bounded set, so 3 avoids serializing independent page
 * reads; direct hosts stay at 1 to remain conservative in serverless.
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
      url.searchParams.set("connection_limit", pooled ? "3" : "1");
    }
    return url.toString();
  } catch {
    return raw;
  }
}
