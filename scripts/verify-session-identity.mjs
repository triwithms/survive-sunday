/**
 * Server-side session identity check (cookie → HTML).
 *
 *   node scripts/verify-session-identity.mjs
 *
 * Client-side (router cache) steps after this passes:
 *   1. Open http://localhost:3000
 *   2. Enter as Black Cobra → header says Black Cobra, /pool is Black Cobra
 *   3. Tap Pick (bottom nav) → still Black Cobra (not Gams / PHI)
 *   4. Back → Enter as Gams → header + /pick Current: PHI
 *   5. Switch commissioner → /admin stays Commissioner
 *   6. /pick has no red Next.js "1 Error" toast
 */
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

async function csrf(jar) {
  const res = await fetch(`${BASE}/api/auth/csrf`, { headers: cookieHeader(jar) });
  const set = res.headers.getSetCookie?.() || [];
  applySetCookie(jar, set);
  const body = await res.json();
  return body.csrfToken;
}

function cookieHeader(jar) {
  return {
    cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; "),
  };
}

function applySetCookie(jar, setCookies) {
  for (const raw of setCookies) {
    const part = raw.split(";")[0];
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1);
    if (!value || /Max-Age=0/i.test(raw) || raw.includes("Expires=Thu, 01 Jan 1970")) {
      jar.delete(name);
      continue;
    }
    jar.set(name, value);
  }
}

async function signIn(email, password) {
  const jar = new Map();
  // Clear any prior identity by hitting signout first
  const csrf1 = await csrf(jar);
  await fetch(`${BASE}/api/auth/signout`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...cookieHeader(jar),
    },
    body: new URLSearchParams({ csrfToken: csrf1, json: "true" }),
    redirect: "manual",
  }).then((r) => applySetCookie(jar, r.headers.getSetCookie?.() || []));

  const token = await csrf(jar);
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken: token,
      email,
      password,
      callbackUrl: `${BASE}/pool`,
      json: "true",
    }),
    redirect: "manual",
  });
  applySetCookie(jar, res.headers.getSetCookie?.() || []);
  if (res.status >= 400) {
    throw new Error(`signIn ${email} failed: ${res.status} ${await res.text()}`);
  }
  const session = await fetch(`${BASE}/api/auth/session`, {
    headers: cookieHeader(jar),
  }).then((r) => r.json());
  return { jar, session };
}

async function page(jar, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...cookieHeader(jar), Accept: "text/html" },
    redirect: "manual",
  });
  const html = await res.text();
  return { status: res.status, html, location: res.headers.get("location") };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const checks = [];
function check(name, cond, detail) {
  checks.push({ name, ok: !!cond, detail });
  if (!cond) console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  else console.log(`PASS  ${name}`);
}

async function main() {
  console.log(`verify-session-identity against ${BASE}\n`);

  const other = await signIn("black-cobra@survivesunday.demo", "demo1234");
  check(
    "Black Cobra session email",
    other.session?.user?.email === "black-cobra@survivesunday.demo",
    JSON.stringify(other.session?.user)
  );

  const otherPool = await page(other.jar, "/pool");
  check("Black Cobra /pool 200", otherPool.status === 200, String(otherPool.status));
  check(
    "Black Cobra /pool header",
    /data-testid="session-nickname"[^>]*>\s*Black Cobra/.test(otherPool.html),
    "missing Black Cobra nickname on /pool"
  );

  const otherPick = await page(other.jar, "/pick");
  check("Black Cobra /pick 200", otherPick.status === 200, String(otherPick.status));
  check(
    "Black Cobra /pick is not Gams PHI",
    otherPick.html.includes("Black Cobra") && !otherPick.html.includes("Gams"),
    "identity leak"
  );
  const otherCurrent = otherPick.html.match(/Current:[\s\S]{0,80}font-mono[^>]*>([A-Z]{2,3})</);
  const otherCurrentAbbr = otherCurrent?.[1] || null;
  check(
    "Black Cobra /pick current is not Gams PHI",
    otherCurrentAbbr !== "PHI",
    `current=${otherCurrentAbbr}`
  );
  check(
    "Black Cobra /pick header nickname",
    /data-testid="session-nickname"[^>]*>\s*Black Cobra/.test(otherPick.html),
    "missing Black Cobra nickname"
  );

  const gams = await signIn("gams@survivesunday.demo", "demo1234");
  check(
    "Gams session email",
    gams.session?.user?.email === "gams@survivesunday.demo",
    JSON.stringify(gams.session?.user)
  );
  const gamsPick = await page(gams.jar, "/pick");
  check("Gams /pick 200", gamsPick.status === 200, String(gamsPick.status));
  check(
    "Gams /pick header",
    /data-testid="session-nickname"[^>]*>\s*Gams/.test(gamsPick.html),
    "missing Gams nickname"
  );
  check(
    "Gams /pick Current PHI",
    gamsPick.html.includes("PHI"),
    "expected Current: PHI"
  );

  const admin = await signIn("admin@survivesunday.demo", "demo1234");
  check(
    "Commissioner session",
    admin.session?.user?.email === "admin@survivesunday.demo",
    JSON.stringify(admin.session?.user)
  );
  const adminPage = await page(admin.jar, "/admin");
  check("Commissioner /admin 200", adminPage.status === 200, String(adminPage.status));
  check(
    "Commissioner /admin stays admin",
    adminPage.html.includes("Commissioner") &&
      !adminPage.html.includes("Commissioner only"),
    "dropped to player view"
  );
  const adminPool = await page(admin.jar, "/pool");
  check(
    "Commissioner /pool header",
    /data-testid="session-nickname"[^>]*>\s*Commissioner/.test(adminPool.html),
    "pool lost commissioner"
  );
  const adminAgain = await page(admin.jar, "/admin");
  check(
    "Commissioner /admin after /pool",
    adminAgain.status === 200 &&
      adminAgain.html.includes("Commissioner") &&
      !adminAgain.html.includes("Commissioner only"),
    "admin nav dropped to player"
  );

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
