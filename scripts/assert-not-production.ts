const PROD_ENDPOINT = "ep-falling-flower-avkrw34u";
const ALLOWED_HOSTS = ["localhost", "127.0.0.1"];
export const PROD_DB_BREAK_GLASS = "ALLOW_PROD_DB_MUTATION";

const URL_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DIRECT_URL",
] as const;

function refuse(msg: string): never {
  console.error(`\n  BLOCKED: ${msg}\n`);
  process.exit(1);
}

function hostOf(script: string, url: string): string {
  try {
    return new URL(url).host;
  } catch {
    refuse(`${script}: DATABASE_URL is unparseable.`);
  }
}

function envUrls(): string[] {
  return URL_KEYS.map((k) => process.env[k]).filter((v): v is string => Boolean(v));
}

function refuseVercel(script: string) {
  if (process.env.VERCEL) {
    refuse(`${script} must never run on Vercel infrastructure.`);
  }
}

function breakGlass(script: string): boolean {
  if (process.env[PROD_DB_BREAK_GLASS] === "1") {
    console.warn(
      `${script}: ${PROD_DB_BREAK_GLASS}=1 — production DB mutation guard bypassed`
    );
    return true;
  }
  return false;
}

function refuseProdHosts(script: string) {
  const urls = envUrls();
  if (urls.length === 0) refuse(`${script}: DATABASE_URL is not set.`);
  for (const url of urls) {
    const host = hostOf(script, url);
    if (host.includes(PROD_ENDPOINT)) {
      refuse(
        `${script} is pointed at PRODUCTION (${host}).\n` +
          `  This is the database that runs the pool. Refusing.\n` +
          `  Emergency only: ${PROD_DB_BREAK_GLASS}=1`
      );
    }
  }
}

/** Block prod Neon. Other remotes OK. Vercel always refused. */
export function assertNotProdNeon(script: string) {
  refuseVercel(script);
  if (breakGlass(script)) return;
  refuseProdHosts(script);
  console.log(`${script}: target ${hostOf(script, envUrls()[0])} — OK`);
}

/** Localhost only (seed / ensure). Break-glass skips host checks. Vercel always refused. */
export function assertNotProduction(script: string) {
  refuseVercel(script);
  if (breakGlass(script)) return;
  refuseProdHosts(script);
  for (const url of envUrls()) {
    const host = hostOf(script, url);
    const bare = host.split(":")[0];
    if (!ALLOWED_HOSTS.includes(bare)) {
      refuse(
        `${script}: ${host} is not an approved target.\n` +
          `  Add it to ALLOWED_HOSTS only if you are certain.`
      );
    }
  }
  console.log(`${script}: target ${hostOf(script, envUrls()[0])} — OK`);
}
