import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function lineCount(path: string) {
  const text = readFileSync(path, "utf8");
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

for (const name of readdirSync("src/lib")) {
  if (!name.startsWith("week-wrap-") || !name.endsWith(".ts")) continue;
  const n = lineCount(join("src/lib", name));
  assert.ok(n <= 100, `${name} is ${n} lines (max 100)`);
}

const send = readFileSync("src/lib/week-wrap-send.ts", "utf8");
assert.match(send, /notifyUser|notifyWrapMembers/);
assert.match(send, /findWeekTouchdownVideo/);
assert.match(send, /syncWeekScoresFromEspn/);
assert.match(send, /loadWrapBoard\(poolId\)/);
assert.match(send, /loadWrapNfl\(\{ sync: true \}\)/);
const extras = readFileSync("src/lib/week-wrap-extras.ts", "utf8");
assert.match(extras, /sortBoard/);
assert.match(extras, /syncTeamStandingsFromEspn/);
assert.match(readFileSync("src/components/features/admin/WeekWrapPreview.tsx", "utf8"), /srcDoc=/);
const copy = readFileSync("src/lib/week-wrap-copy.ts", "utf8");
assert.match(copy, /withGameEmailHtml/);
assert.match(copy, /withGameSmsFooter/);
assert.doesNotMatch(copy, /week-wrap-youtube|openai|anthropic/i);
const dispatch = readFileSync("src/lib/notify-dispatch.ts", "utf8");
assert.match(dispatch, /\$\{opts\.dedupeKey\}:\$\{plan\.channel\}/);
assert.match(dispatch, /withGameEmailHtml/);
const cron = readFileSync("src/app/api/cron/week-wrap/route.ts", "utf8");
assert.match(cron, /cronAuthorized/);
assert.match(cron, /runDueWeekWraps/);
assert.match(readFileSync("src/lib/week-wrap-run.ts", "utf8"), /syncWeekScoresFromEspn/);
const vercel = readFileSync("vercel.json", "utf8");
assert.match(vercel, /"path": "\/api\/cron\/week-wrap",\s*"schedule": "0 16 \* \* \*"/);
assert.match(vercel, /"path": "\/api\/cron\/week-wrap",\s*"schedule": "0 17 \* \* \*"/);
assert.match(readFileSync("src/components/features/admin/SystemScreen.tsx", "utf8"), /WeekWrapPanel/);
const help = readFileSync("src/components/features/help/HelpForAdmins.tsx", "utf8");
assert.match(help, /Week wrap/);
assert.match(help, /Send now/);
assert.match(help, /Skip this week/);
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: { build: string } };
assert.equal(pkg.scripts.build, "next build");
const handoff = readFileSync("docs/HANDOFF.md", "utf8");
assert.match(handoff, /Every Touchdown of Week N/);
assert.match(handoff, /YOUTUBE_API_KEY/);
assert.match(handoff, /account\/notifications/);
const tone = readFileSync("src/lib/week-wrap-tone.ts", "utf8");
assert.match(tone, /placeholder/i);
assert.doesNotMatch(tone, /openai|anthropic/i);
console.log("PASS  cron + admin wiring");
