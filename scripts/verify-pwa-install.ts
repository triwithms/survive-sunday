/**
 * Add to Home Screen prompt decisions (no browser).
 *
 *   npx tsx scripts/verify-pwa-install.ts
 */
import assert from "node:assert/strict";
import {
  decideAddToHomePrompt,
  detectAndroid,
  detectIos,
  isMobileBrowser,
} from "../src/lib/pwa-install";

const base = {
  standalone: false,
  mobile: true,
  dismissed: false,
  snoozed: false,
  pending: true,
  greetedStandalone: false,
};

assert.equal(decideAddToHomePrompt(base), "ask", "pending mobile → ask");
assert.equal(
  decideAddToHomePrompt({ ...base, standalone: true }),
  "good",
  "pending standalone → one-time good"
);
assert.equal(
  decideAddToHomePrompt({
    ...base,
    standalone: true,
    greetedStandalone: true,
  }),
  "hide",
  "already greeted standalone → never nag"
);
assert.equal(
  decideAddToHomePrompt({ ...base, dismissed: true }),
  "hide",
  "Yes dismisses permanently"
);
assert.equal(
  decideAddToHomePrompt({ ...base, snoozed: true }),
  "hide",
  "Not now snoozes"
);
assert.equal(
  decideAddToHomePrompt({ ...base, mobile: false, pending: true }),
  "hide",
  "desktop does not nag"
);
assert.equal(
  decideAddToHomePrompt({ ...base, pending: false }),
  "hide",
  "no pending → hide"
);

assert.equal(isMobileBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), true);
assert.equal(detectIos("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), true);
assert.equal(detectAndroid("Mozilla/5.0 (Linux; Android 14)"), true);
assert.equal(detectIos("Mozilla/5.0 (Linux; Android 14)"), false);
assert.equal(isMobileBrowser("Mozilla/5.0 (Macintosh; Intel Mac OS X)", 5), true);
assert.equal(isMobileBrowser("Mozilla/5.0 (Windows NT 10.0)", 0), false);

console.log("verify-pwa-install OK");
