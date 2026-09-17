const PROD_ENDPOINT = "ep-falling-flower-avkrw34u";
const ALLOWED_HOSTS = ["localhost", "127.0.0.1"];

function refuse(msg: string): never {
  console.error(`\n  BLOCKED: ${msg}\n`);
  process.exit(1);
}

export function assertNotProduction(script: string) {
  if (process.env.VERCEL) {
    refuse(`${script} must never run on Vercel infrastructure.`);
  }

  const url = process.env.DATABASE_URL;
  if (!url) refuse(`${script}: DATABASE_URL is not set.`);

  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    refuse(`${script}: DATABASE_URL is unparseable.`);
  }

  if (host.includes(PROD_ENDPOINT)) {
    refuse(
      `${script} is pointed at PRODUCTION (${host}).\n` +
      `  This is the database that runs the pool. Refusing.`
    );
  }

  const bare = host.split(":")[0];
  if (!ALLOWED_HOSTS.includes(bare)) {
    refuse(
      `${script}: ${host} is not an approved target.\n` +
      `  Add it to ALLOWED_HOSTS only if you are certain.`
    );
  }

  console.log(`${script}: target ${host} — OK`);
}
