/**
 * Guard against copying the whole Prisma tree into every serverless function.
 * Hobby Functions Storage is a 30-day cumulative total of those artifacts.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(resolve("next.config.ts"), "utf8");

function assert(cond: boolean, message: string) {
  if (!cond) {
    console.error(`FAIL  ${message}`);
    process.exit(1);
  }
}

assert(
  /serverExternalPackages:\s*\[\s*"@prisma\/client"\s*\]/.test(src),
  "serverExternalPackages must keep @prisma/client (and not the prisma CLI)"
);
assert(
  !/"\/\*"\s*:\s*\[[^\]]*@prisma\/client\/\*\*/.test(src),
  "do not glob @prisma/client/** onto /* — that multiplies Functions Storage"
);
assert(
  src.includes("libquery_engine-rhel-openssl-3.0.x.so.node"),
  "auth/API/cron must still include the Vercel (RHEL) query engine"
);
assert(
  src.includes("outputFileTracingExcludes"),
  "exclude unused Prisma engines / WASM so NFT path.join hints do not re-bloat traces"
);
assert(
  src.includes("libquery_engine-debian") && src.includes("*.wasm"),
  "excludes must drop the debian engine and unused WASM runtimes"
);

console.log("PASS  Prisma function tracing stays narrow (RHEL engine, no /* client dump)");
