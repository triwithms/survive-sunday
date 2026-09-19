/**
 * Settings hub: header Account → /account (no notify form duplicate).
 *
 *   npx tsx scripts/verify-account-hub.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function src(path: string) {
  return readFileSync(path, "utf8");
}

const menu = src("src/components/AccountMenu.tsx");
assert.match(menu, /href="\/account"/);
assert.match(menu, /Account and Settings/);
assert.doesNotMatch(menu, /NotificationPrefsForm|NotifyPrefSelect/);
assert.doesNotMatch(menu, /Commissioner/);

const hub = src("src/components/features/account/AccountScreen.tsx");
assert.match(hub, /Settings/);
assert.match(hub, /RoleSwitcher/);
assert.match(hub, /SignOutButton/);
assert.doesNotMatch(hub, /NotificationPrefsForm|NotifyPrefSelect/);
assert.doesNotMatch(hub, /Commissioner/);

const links = src("src/components/features/account/AccountHubLinks.tsx");
assert.match(links, /\/account\/notifications/);
assert.match(links, /\/account\/mirror/);
assert.match(links, /\/help/);
assert.match(links, /FEEDBACK_MAILTO/);
assert.match(links, /Report a bug or idea/);
assert.doesNotMatch(links, /Commissioner/);
const row = src("src/components/features/account/account-row.ts");
assert.match(
  row,
  /mailto:robertgama@gmail.com\?subject=Survive%20Sunday%20feedback/
);

const install = src("src/components/features/account/AccountInstallLink.tsx");
assert.match(install, /\/help#install/);
assert.match(install, /reopenA2hsNudge/);
assert.match(install, /Install on Home Screen/);

const page = src("src/app/(app)/account/page.tsx");
assert.match(page, /loadAccountPage/);
assert.match(page, /AccountScreen/);

const mirror = src("src/app/(app)/account/mirror/page.tsx");
assert.match(mirror, /loadMirrorPage/);
assert.doesNotMatch(mirror, /redirect\("\/account\/notifications"\)/);

const notify = src("src/app/(app)/account/notifications/page.tsx");
assert.match(notify, /href="\/account"/);
assert.match(notify, /NotificationPrefsForm/);
assert.match(notify, /Account \(header\) → Notification preferences/);

const header = src("src/components/AppHeader.tsx");
assert.match(header, /AccountMenu/);
assert.doesNotMatch(header, /<button/);

const folder = "src/components/features/account";
for (const name of readdirSync(folder)) {
  if (!/\.(ts|tsx)$/.test(name)) continue;
  const path = join(folder, name);
  const n = src(path).split("\n").length;
  assert.ok(n <= 100, `${path} is ${n} lines (max 100)`);
}
assert.ok(menu.split("\n").length <= 100, "AccountMenu over 100 lines");
assert.ok(page.split("\n").length <= 100, "account page over 100 lines");

console.log("verify-account-hub OK");
