/**
 * Server-side session identity check (cookie → HTML).
 *
 *   node scripts/verify-session-identity.mjs
 *
 * Client-side (router cache) steps after this passes:
 *   1. Open http://localhost:3000
 *   2. Enter as Frost → header says Frost, /pool is Frost
 *   3. Tap Pick (bottom nav) → still Frost (not Aurora / PHI)
 *   4. Back → Enter as Aurora → header + /pick Current: PHI
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

  const frost = await signIn("frost@survivesunday.demo", "demo1234");
  check(
    "Frost session email",
    frost.session?.user?.email === "frost@survivesunday.demo",
    JSON.stringify(frost.session?.user)
  );

  const frostPool = await page(frost.jar, "/pool");
  check("Frost /pool 200", frostPool.status === 200, String(frostPool.status));
  check(
    "Frost /pool header",
    /data-testid="session-nickname"[^>]*>\s*Frost/.test(frostPool.html),
    "missing Frost nickname on /pool"
  );

  const frostPick = await page(frost.jar, "/pick");
  check("Frost /pick 200", frostPick.status === 200, String(frostPick.status));
  check(
    "Frost /pick is Frost not Aurora PHI",
    frostPick.html.includes("Frost") &&
      !frostPick.html.includes("Current:</") &&
      !frostPick.html.includes(">PHI</") ||
      (frostPick.html.includes("Frost") && !frostPick.html.includes("Aurora")),
    "identity leak"
  );
  // More precise: header nickname Frost, current pick is not PHI unless Frost picked PHI
  const frostCurrent = frostPick.html.match(/Current:[\s\S]{0,80}font-mono[^>]*>([A-Z]{2,3})</);
  const frostCurrentAbbr = frostCurrent?.[1] || null;
  check(
    "Frost /pick current is not Aurora PHI (unless Frost picked PHI)",
    frostCurrentAbbr !== "PHI" || frostPick.html.includes("data-testid=\"session-nickname\"") && frostPick.html.includes("Frost"),
    `current=${frostCurrentAbbr}`
  );
  check(
    "Frost /pick header nickname",
    /data-testid="session-nickname"[^>]*>\s*Frost/.test(frostPick.html),
    "missing Frost nickname"
  );

  const aurora = await signIn("aurora@survivesunday.demo", "demo1234");
  check(
    "Aurora session email",
    aurora.session?.user?.email === "aurora@survivesunday.demo",
    JSON.stringify(aurora.session?.user)
  );
  const auroraPick = await page(aurora.jar, "/pick");
  check("Aurora /pick 200", auroraPick.status === 200, String(auroraPick.status));
  check(
    "Aurora /pick header",
    /data-testid="session-nickname"[^>]*>\s*Aurora/.test(auroraPick.html),
    "missing Aurora nickname"
  );
  check(
    "Aurora /pick Current PHI",
    auroraPick.html.includes("PHI"),
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
