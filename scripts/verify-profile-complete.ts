/**
 * After Sign in, only missing nickname / full name / cell are asked.
 *
 *   npx tsx scripts/verify-profile-complete.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  missingProfileFields,
  profileIsComplete,
} from "../src/lib/profile-complete";

const full = {
  nickname: "Gams",
  realName: "Robert Gama",
  userName: "Robert Gama",
  phoneE164: "+14169514262",
};

assert.deepEqual(missingProfileFields(full), []);
assert.equal(profileIsComplete(full), true);

assert.deepEqual(
  missingProfileFields({ ...full, nickname: "  " }),
  ["nickname"]
);
assert.deepEqual(
  missingProfileFields({ ...full, realName: null, userName: "" }),
  ["fullName"]
);
assert.deepEqual(
  missingProfileFields({ ...full, realName: "", userName: "Robert" }),
  [],
  "user.name counts as full name"
);
assert.deepEqual(
  missingProfileFields({ ...full, phoneE164: null }),
  ["phone"]
);
assert.deepEqual(
  missingProfileFields({
    nickname: "",
    realName: "",
    userName: "",
    phoneE164: "",
  }),
  ["nickname", "fullName", "phone"]
);

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

for (const name of readdirSync("src/components/features/profile")) {
  if (!/\.(ts|tsx)$/.test(name)) continue;
  const path = join("src/components/features/profile", name);
  const n = lineCount(path);
  assert.ok(n <= 100, `${path} is ${n} lines`);
}
assert.ok(lineCount("src/lib/profile-complete.ts") <= 100);
assert.ok(lineCount("src/app/welcome/page.tsx") <= 100);

console.log("verify-profile-complete OK");
