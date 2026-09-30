/**
 * Phone chrome: sticky header / BottomNav + read-only header Week N.
 * Scroll model (globals.css): touch screens lock the viewport and only
 * [data-app-main] scrolls; mouse/trackpad keeps document scroll.
 *
 *   npx tsx scripts/verify-app-chrome.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function src(path: string) {
  return readFileSync(path, "utf8");
}

function cssBlock(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `globals.css: ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

function assertAppShell(file: string) {
  const code = src(file);
  assert.match(code, /<BottomNav/, `${file}: BottomNav`);
  assert.match(code, /<ChromeInsets/, `${file}: ChromeInsets`);
  assert.match(code, /className="app-shell"/, `${file}: .app-shell`);
  assert.match(code, /data-app-main="" className="app-main"/, `${file}: one scroll pane`);
  assert.doesNotMatch(
    code,
    /(?<![-\w])h-dvh|h-screen|100vh|overflow-hidden|overflow-y-auto|overflow-auto/,
    `${file}: scroll locks live in globals.css (.app-shell / .app-main), scoped to touch screens`
  );
  assert.doesNotMatch(code, /pb-24/, `${file}: tab bar must not use spacer padding`);
}

assertAppShell("src/app/(app)/layout.tsx");
assertAppShell("src/app/help/page.tsx");

const nav = src("src/components/BottomNav.tsx");
assert.match(nav, /sticky bottom-0 shrink-0/);
assert.match(nav, /data-app-nav/);
assert.doesNotMatch(
  nav,
  /fixed bottom-0/,
  "position:fixed tab bar is lost on iOS when any ancestor becomes a scrollport"
);
assert.match(nav, /z-40/);
assert.match(nav, /pb-\[env\(safe-area-inset-bottom\)\]/);
assert.match(nav, /bg-stadium-900\/95/);
assert.match(nav, /My pick/);
assert.match(nav, /Selections/);
assert.match(nav, /Leaderboard/);
assert.match(nav, /Scores/);
assert.match(nav, /Schedule/);
assert.match(nav, /Standings/);

const css = src("src/app/globals.css");
assert.doesNotMatch(
  css,
  /html\s*\{[^}]*overflow-x:\s*(hidden|clip)/,
  "html overflow-x hidden/clip breaks iOS bottom nav"
);
assert.doesNotMatch(
  css,
  /body\s*\{[^}]*overflow-x:\s*(hidden|clip)/,
  "body overflow-x hidden/clip breaks iOS bottom nav"
);

assert.match(css, /scroll-padding-top:\s*var\(--app-header-h/);
assert.match(css, /scroll-padding-bottom:\s*var\(--app-nav-h/);
assert.doesNotMatch(
  css,
  /(^|\n)(html|body)\s*\{[^}]*(overflow(-y)?:\s*(hidden|auto|scroll|clip)|(?<![-\w])height:\s*100(d|s|l)?vh)/,
  "unscoped html/body locks break document scroll on desktop and sign-in pages"
);
assert.doesNotMatch(css, /(?<![-\w])100vh;\s*\n(?!\s*(min-)?height:\s*100dvh)/, "100vh only as a 100dvh fallback");

const touch = css.slice(css.indexOf("@media (pointer: coarse)"));
assert.ok(touch.length > 0, "touch-screen scroll lock");
const lockedRoot = cssBlock(touch, "html:has(.app-shell) body");
assert.match(lockedRoot, /height:\s*100%/);
assert.match(lockedRoot, /overflow:\s*hidden/);
assert.match(lockedRoot, /overscroll-behavior:\s*none/);
const lockedShell = cssBlock(touch, ".app-shell");
assert.match(lockedShell, /height:\s*100vh;\s*height:\s*100dvh/);
assert.match(lockedShell, /overflow:\s*hidden/);
const pane = cssBlock(touch, ".app-main");
assert.match(pane, /min-height:\s*0/);
assert.match(pane, /overflow-y:\s*auto/);
assert.match(pane, /overscroll-behavior:\s*contain/);
assert.match(touch, /--app-sticky-top:\s*0px/, "in-pane sticky bars pin to the pane top");
assert.match(touch, /font-size:\s*max\(16px, 100%\)/, "iOS focus zoom");
const desktopPane = cssBlock(css, ".app-main");
assert.match(desktopPane, /overflow-x:\s*clip/, "clip (not hidden) sideways keeps sticky chrome pinned");
assert.doesNotMatch(desktopPane, /overflow-y/);

const popup = cssBlock(css, ".popup-card");
assert.match(popup, /overflow-y:\s*auto/);
assert.match(popup, /overscroll-behavior:\s*contain/);
assert.match(cssBlock(css, ".popup-card > :first-child"), /position:\s*sticky/, "popup title + Close pinned");

const lock = src("src/lib/page-scroll-lock.ts");
assert.match(lock, /\[data-app-main\]/);
assert.match(lock, /scrollTop = s\.paneTop/, "closing a popup restores the pane offset");
assert.match(lock, /window\.scrollTo\(0, s\.windowY\)/, "closing a popup restores the document offset");

for (const file of [
  "src/components/ModalDialog.tsx",
  "src/components/ShareLinkPanel.tsx",
  "src/components/features/pick/PickConfirmPanel.tsx",
  "src/components/features/admin/ConfirmSheet.tsx",
]) {
  const code = src(file);
  assert.match(code, /usePageScrollLock\(\)/, `${file}: page behind must not scroll`);
  assert.match(code, /popup-card/, `${file}: popup scrolls inside itself`);
  assert.match(code, /max-h-\[min\(90dvh,100%\)\]|max-h-full/, `${file}: popup height cap`);
  assert.match(code, /env\(safe-area-inset-bottom\)/, `${file}: safe-area bottom`);
  assert.match(code, /overscroll-contain/, `${file}: backdrop drags do not chain`);
  assert.doesNotMatch(code, /body\.style\.overflow/, `${file}: use lockPageScroll`);
}

const insets = src("src/components/ChromeInsets.tsx");
assert.match(insets, /appScrollPane\(\)\?\.scrollTo\(0, 0\)/, "tabs start at the top of the pane");

const roster = src("src/components/features/admin/RosterRecordBar.tsx");
assert.match(
  roster,
  /sticky top-\[var\(--app-sticky-top,0px\)\]/,
  "in-page sticky bars sit under the sticky header"
);

const header = src("src/components/AppHeader.tsx");
assert.match(header, /sticky top-0/);
assert.match(header, /data-app-header/);
assert.match(header, /weekNumber=\{data\.currentWeek\}/);
assert.match(header, /HeaderShareButton/);
assert.doesNotMatch(
  header,
  /HeaderWeekNav|pickActionWeek|ChevronLeft|<select|<button/,
  "header week is a read-only pool label"
);

const badge = src("src/components/HeaderWeekBadge.tsx");
assert.match(badge, /headerPoolWeekLabel/);
assert.match(badge, /role="status"/);
assert.doesNotMatch(badge, /chip-gold|<button|<select|href=/);
assert.doesNotMatch(badge, /W\{weekNumber\}/);

for (const file of [
  "src/components/BottomNav.tsx",
  "src/components/HeaderWeekBadge.tsx",
  "src/components/AppHeader.tsx",
  "src/components/HeaderShareButton.tsx",
  "src/components/HeaderHelpLink.tsx",
  "src/components/ChromeInsets.tsx",
  "src/app/(app)/layout.tsx",
]) {
  const lines = src(file).split("\n").length;
  assert.ok(lines <= 100, `${file} is ${lines} lines (max 100)`);
}

console.log("verify-app-chrome OK");
