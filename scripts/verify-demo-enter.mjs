/**
 * End-to-end demo-enter: form POST must create a session and reach /pool
 * without ?error=NoSession.
 *
 *   BASE_URL=http://127.0.0.1:3000 node scripts/verify-demo-enter.mjs
 */
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

function applySetCookie(jar, setCookies) {
  for (const raw of setCookies || []) {
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

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function request(jar, path, init = {}) {
  const headers = new Headers(init.headers);
  const cookie = cookieHeader(jar);
  if (cookie) headers.set("cookie", cookie);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });
  applySetCookie(jar, res.headers.getSetCookie?.() || []);
  return res;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log(`verify-demo-enter against ${BASE}\n`);
  const jar = new Map();

  const csrf = await request(jar, "/api/auth/csrf");
  const csrfText = await csrf.text();
  assert(csrf.ok, `/api/auth/csrf ${csrf.status} ${csrfText}`);
  const csrfBody = JSON.parse(csrfText);
  assert(csrfBody.csrfToken, "csrfToken missing");
  console.log("PASS  /api/auth/csrf 200");

  const session0 = await request(jar, "/api/auth/session");
  const before = await session0.json();
  assert(!before?.user?.id, `expected empty session, got ${JSON.stringify(before)}`);
  console.log("PASS  session empty before login");

  const enter = await request(jar, "/api/demo-enter", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      email: "gams@survivesunday.demo",
      password: "demo1234",
    }),
  });
  const location = enter.headers.get("location") || "";
  assert(
    enter.status === 303 || enter.status === 307 || enter.status === 302,
    `demo-enter status ${enter.status}`
  );
  assert(
    !/[?&]error=NoSession/.test(location),
    `demo-enter redirected to ${location}`
  );
  assert(
    location === "/pool" || location.endsWith("/pool") || location.includes("/signed-in"),
    `expected /pool (or /signed-in), got ${location}`
  );
  const sessionNames = [...jar.keys()].filter((n) => n.includes("session-token"));
  assert(sessionNames.length > 0, `no session cookie after demo-enter; cookies=${[...jar.keys()]}`);
  console.log(`PASS  demo-enter → ${location} with ${sessionNames.join(", ")}`);

  const session1 = await request(jar, "/api/auth/session");
  const after = await session1.json();
  assert(
    after?.user?.email === "gams@survivesunday.demo",
    `session after login: ${JSON.stringify(after)}`
  );
  console.log("PASS  /api/auth/session is Gams");

  let hop = location.startsWith("http") ? new URL(location).pathname + new URL(location).search : location;
  for (let i = 0; i < 4; i++) {
    const page = await request(jar, hop, { headers: { accept: "text/html" } });
    const next = page.headers.get("location");
    if (next) {
      assert(!/[?&]error=NoSession/.test(next), `html hop to ${next}`);
      hop = next.startsWith("http") ? new URL(next).pathname + new URL(next).search : next;
      continue;
    }
    assert(page.status === 200, `/pool hop status ${page.status} at ${hop}`);
    assert(hop === "/pool" || hop.startsWith("/pool"), `landed on ${hop}`);
    const html = await page.text();
    assert(!html.includes("no session created"), "NoSession copy on page");
    console.log(`PASS  HTML ${hop} 200 with session`);
    break;
  }

  console.log("\nverify-demo-enter OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
