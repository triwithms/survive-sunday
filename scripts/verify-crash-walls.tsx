/**
 * A crashing secondary panel on a player tab shows "Something went wrong —
 * Retry", reports to Admin → System → Server errors (no PII), and leaves
 * the pick list usable. Player tabs still paint from Postgres first.
 *
 *   npx tsx scripts/verify-crash-walls.tsx
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import {
  clientErrorRoute,
  createRateGate,
  parseClientErrorBody,
  scrubPii,
} from "../src/lib/client-error";

assert.equal(scrubPii("sent to pat.smith@example.com ok"), "sent to [email] ok");
assert.equal(scrubPii("call +1 (416) 555-0199 now"), "call [phone] now");
assert.equal(scrubPii("Week 3 kickoff 2026-09-27"), "Week 3 kickoff 2026-09-27");
const parsed = parseClientErrorBody({
  panel: "Pick-Notices!",
  path: "/pick?week=3&email=a@b.co#x",
  message: "  TypeError:\n boom for a@b.co  ",
});
assert.deepEqual(parsed, {
  panel: "pick-notices",
  path: "/pick",
  message: "TypeError: boom for [email]",
});
assert.equal(clientErrorRoute(parsed!), "/pick · pick-notices");
assert.equal(parseClientErrorBody({ panel: "x", path: "/", message: "  " }), null);
assert.equal(parseClientErrorBody("nope"), null);
const gate = createRateGate(2, 1000);
assert.deepEqual([gate(0), gate(10), gate(20), gate(1000)], [true, true, false, true]);
console.log("PASS  crash reports are scrubbed, shaped, and capped");

const errorLog = readFileSync("src/lib/server-error-log.ts", "utf8");
assert.match(errorLog, /scrubPii\(input\.message/);
const route = readFileSync("src/app/api/client-error/route.ts", "utf8");
assert.match(route, /await auth\(\)/);
assert.match(route, /source: "client"/);
assert.match(route, /recordServerError\(/);
console.log("PASS  client crashes land in the existing ServerError log");

const walls: Array<[string, string[]]> = [
  ["src/components/features/pick/PickScreen.tsx", ["pick-current", "pick-notices"]],
  ["src/app/(app)/pick/page.tsx", ["pick-live-refresh"]],
  ["src/components/features/home/HomeScreen.tsx", ["home-week-header", "home-live-refresh"]],
  ["src/components/features/scores/ScoresScreen.tsx", ["scores-games", "scores-picks"]],
  ["src/components/features/scores/ScoresHeading.tsx", ["scores-share", "scores-live-refresh"]],
  ["src/components/features/schedule/ScheduleScreen.tsx", ["schedule-live-refresh"]],
  ["src/components/ScoreGameDetailSheet.tsx", ["game-detail", "game-detail-espn", "game-highlights"]],
  ["src/components/AppHeader.tsx", ["header-account", "header-share", "header-rules"]],
  ["src/app/(app)/layout.tsx", ["footer", "a2hs-nudge", "chrome-insets"]],
];
for (const [file, names] of walls) {
  const text = readFileSync(file, "utf8");
  for (const name of names) {
    assert.match(text, new RegExp(`<SectionBoundary[^>]*name="${name}"`), `${file} walls ${name}`);
  }
}
const pickScreen = readFileSync("src/components/features/pick/PickScreen.tsx", "utf8");
assert.doesNotMatch(
  pickScreen,
  /<SectionBoundary[^>]*>\s*<PickGameList/,
  "the pick list is core — not hidden behind a panel wall"
);
const header = readFileSync("src/app/(app)/load-app-header.ts", "utf8");
assert.match(header, /unstable_rethrow\(error\)/);
assert.match(header, /fallbackWeekChrome\(me\)/);
console.log("PASS  player tabs and the shared layout wall off secondary panels");

const loaders = [
  "src/components/features/home/load-home.ts",
  "src/components/features/pick/load-pick.ts",
  "src/components/features/scores/load-scores.ts",
  "src/components/features/schedule/load-schedule.ts",
  "src/app/(app)/load-app-header.ts",
];
for (const file of loaders) {
  const text = readFileSync(file, "utf8");
  assert.doesNotMatch(
    text,
    /await (syncWeekScoresFromEspn|syncPoolWeekFromEspn|fetchEspn\w*|ensureWeekLockedEffects)\(/,
    `${file} must not wait on ESPN before paint`
  );
}
console.log("PASS  no ESPN wait before first paint");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://survive.test/pick?week=3",
});
const beacons: string[] = [];
const g = globalThis as Record<string, unknown>;
g.window = dom.window;
g.self = dom.window;
g.requestIdleCallback = (cb: () => void) => setTimeout(cb, 0);
g.cancelIdleCallback = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
g.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.Node = dom.window.Node;
g.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    userAgent: "node",
    sendBeacon: (_url: string, body: Blob) => {
      void body.text().then((text) => beacons.push(text));
      return true;
    },
  },
});

async function main() {
  const React = await import("react");
  // tsconfig keeps jsx: "preserve" for Next, so tsx emits classic React.createElement.
  g.React = React;
  const { act } = React;
  const { createRoot } = await import("react-dom/client");
  const { PickScreen } = await import("../src/components/features/pick/PickScreen");
  const { SectionBoundary } = await import("../src/components/SectionBoundary");
  const { normalizeGameDetail } = await import("../src/components/ScoreGameDetailSheet");
  const quietConsole = console.error;
  console.error = () => undefined;

  const detail = normalizeGameDetail({ status: "live" });
  assert.deepEqual(
    [detail.scoringPlays, detail.recentDrives, detail.leaders, detail.currentDrive],
    [[], [], [], null]
  );
  console.log("PASS  partial ESPN detail payload renders as empty, not a throw");

  const side = (abbr: string) => ({
    abbr, name: abbr, logoUrl: null, alreadyUsed: false,
    priorYearRank: null, standing: null,
  });
  const matchup = {
    id: "g1", kickoff: "2026-10-04T17:00:00.000Z", status: "scheduled",
    scoreAway: null, scoreHome: null, note: null,
    spreadHome: null, spreadAway: null, mlHome: null, mlAway: null,
    away: side("BUF"), home: side("MIA"),
  };
  const brokenBanner = {
    get title(): string {
      throw new Error("notice feed exploded for pat@example.com");
    },
    body: "",
  };
  const picked: string[] = [];
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(
      <PickScreen
        weekNumber={3}
        copy={{ kicker: "Week 3", banner: brokenBanner, showWeek1ChangeCard: false, showDismissibleTip: false }}
        list={[matchup]}
        selectedAbbr={null}
        currentPick={null}
        readOnly={false}
        lockStarted={false}
        spectator={false}
        msg=""
        redirectIn={null}
        tipWeek={null}
        confirm={null}
        busy={false}
        emptyMessage="No pick yet"
        changeHint={null}
        onPick={(s) => picked.push(s.abbr)}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />
    );
  });
  await new Promise((resolve) => setTimeout(resolve, 20));

  const wall = host.querySelector('[data-section="pick-notices"]');
  assert.ok(wall, "notices wall shows its fallback");
  assert.match(wall.textContent ?? "", /Something went wrong/);
  assert.ok([...wall.querySelectorAll("button")].some((b) => b.textContent === "Retry"));
  assert.match(host.textContent ?? "", /This week.s games/);
  const pickButtons = [...host.querySelectorAll("button")].filter(
    (b) => b.closest("section[aria-label]") && !b.hasAttribute("aria-haspopup")
  );
  assert.ok(pickButtons.length >= 2, "both teams still pickable");
  await act(async () => {
    pickButtons[0].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  assert.deepEqual(picked, ["BUF"]);
  console.log("PASS  a crashing notice leaves My pick matchups usable");

  assert.equal(beacons.length, 1, "one crash report per panel");
  const sent = JSON.parse(beacons[0]);
  assert.equal(sent.panel, "pick-notices");
  assert.equal(sent.path, "/pick");
  assert.match(sent.message, /notice feed exploded/);
  assert.doesNotMatch(beacons[0], /@example\.com/);
  console.log("PASS  the crash is reported for Admin without PII");

  let fail = true;
  function Flaky() {
    if (fail) throw new Error("flaky panel");
    return <p data-testid="flaky-ok">loaded</p>;
  }
  const reports: string[] = [];
  const host2 = document.createElement("div");
  document.body.appendChild(host2);
  const root2 = createRoot(host2);
  await act(async () => {
    root2.render(
      <div>
        <SectionBoundary name="flaky" report={(panel) => reports.push(panel)}>
          <Flaky />
        </SectionBoundary>
        <p data-testid="core">core</p>
      </div>
    );
  });
  assert.ok(host2.querySelector('[data-testid="core"]'));
  const retry = [...host2.querySelectorAll("button")].find((b) => b.textContent === "Retry");
  assert.ok(retry);
  assert.deepEqual(reports, ["flaky"]);
  fail = false;
  await act(async () => {
    retry.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  assert.ok(host2.querySelector('[data-testid="flaky-ok"]'), "Retry remounts the panel");
  assert.equal(host2.querySelector('[data-testid="section-error"]'), null);
  console.log("PASS  Retry reloads just the failed panel");

  await act(async () => {
    root.unmount();
    root2.unmount();
  });
  console.error = quietConsole;
}

main().then(
  () => process.exit(0),
  (error) => {
    process.stderr.write(`FAIL  ${error?.stack ?? error}\n`);
    for (const inner of error?.errors ?? []) process.stderr.write(`  - ${inner?.stack ?? inner}\n`);
    process.exit(1);
  }
);
