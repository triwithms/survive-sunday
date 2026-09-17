/**
 * Guard checks only — fake URLs, no real database.
 *
 *   npx tsx scripts/verify-db-mutation-guard.ts
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { PROD_DB_BREAK_GLASS } from "./assert-not-production";

const PROD =
  "postgresql://u:p@ep-falling-flower-avkrw34u.us-east-1.aws.neon.tech/neondb";
const OTHER = "postgresql://u:p@ep-other-branch.neon.tech/neondb";
const LOCAL = "postgresql://u:p@localhost:5432/neondb";

function run(script: string, env: NodeJS.ProcessEnv, extra: string[] = []) {
  return spawnSync("npx", ["tsx", script, ...extra], {
    encoding: "utf8",
    timeout: 20_000,
    env: { ...process.env, ...env, DATABASE_URL: env.DATABASE_URL ?? "" },
  });
}

function out(result: ReturnType<typeof spawnSync>) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function main() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts.build, "next build");
  assert.match(pkg.scripts["db:push"], /guard-db-mutation/);
  assert.match(pkg.scripts.setup, /guard-db-mutation/);

  const guard = "scripts/guard-db-mutation.ts";
  const ensure = "scripts/_dangerous/ensure-production-db.ts";
  const stub = "scripts/ensure-production-db.ts";
  const verify = "scripts/_dangerous/verify-ensure-production-db.ts";
  const glass = { [PROD_DB_BREAK_GLASS]: "1" };

  let r = run(guard, { DATABASE_URL: PROD }, ["db:push"]);
  assert.notEqual(r.status, 0);
  assert.match(out(r), /BLOCKED|PRODUCTION/);

  r = run(guard, { DATABASE_URL: PROD, ...glass }, ["db:push"]);
  assert.equal(r.status, 0);
  assert.match(out(r), /bypassed/);

  r = run(guard, { DATABASE_URL: LOCAL, DIRECT_URL: PROD }, ["db:push"]);
  assert.notEqual(r.status, 0);
  assert.match(out(r), /BLOCKED|PRODUCTION/);

  r = run(
    guard,
    { DATABASE_URL: PROD, ...glass, VERCEL: "1" },
    ["db:push"]
  );
  assert.notEqual(r.status, 0);
  assert.match(out(r), /Vercel/);

  r = run(guard, { DATABASE_URL: LOCAL }, ["db:push"]);
  assert.equal(r.status, 0);

  r = run(guard, { DATABASE_URL: OTHER }, ["setup"]);
  assert.equal(r.status, 0);

  r = run(stub, { DATABASE_URL: LOCAL });
  assert.notEqual(r.status, 0);
  assert.match(out(r), /_dangerous/);

  r = run(ensure, { DATABASE_URL: PROD });
  assert.notEqual(r.status, 0);
  assert.match(out(r), /BLOCKED|PRODUCTION/);

  r = run(ensure, { DATABASE_URL: OTHER });
  assert.notEqual(r.status, 0);
  assert.match(out(r), /not an approved target/);

  r = run(verify, { DATABASE_URL: PROD });
  assert.notEqual(r.status, 0);
  assert.match(out(r), /BLOCKED|PRODUCTION/);

  r = run("scripts/verify-ensure-production-db.ts", { DATABASE_URL: LOCAL });
  assert.notEqual(r.status, 0);
  assert.match(out(r), /_dangerous/);

  console.log("verify-db-mutation-guard: ok");
}

main();
