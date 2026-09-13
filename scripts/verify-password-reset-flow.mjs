/**
 * End-to-end: demo login still one-step; a real account can reset via OTP.
 *
 *   BASE_URL=http://127.0.0.1:3000 node scripts/verify-password-reset-flow.mjs
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

async function credentialsLogin(jar, email, password) {
  try {
    const csrf0 = await request(jar, "/api/auth/csrf");
    const csrf0Body = await csrf0.json();
    await request(jar, "/api/auth/signout", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: csrf0Body.csrfToken, callbackUrl: "/" }),
    });
  } catch {
    /* ok */
  }
  const csrf = await request(jar, "/api/auth/csrf");
  const csrfBody = await csrf.json();
  await request(jar, "/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrfBody.csrfToken,
      email,
      password,
      callbackUrl: "/pool",
      json: "true",
    }),
  });
  return (await request(jar, "/api/auth/session")).json();
}

async function main() {
  console.log(`verify-password-reset-flow against ${BASE}\n`);

  const demoJar = new Map();
  const enter = await request(demoJar, "/api/demo-enter", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      email: "gams@survivesunday.demo",
      password: "demo1234",
    }),
  });
  assert([302, 303, 307].includes(enter.status), `demo-enter ${enter.status}`);
  const loc = enter.headers.get("location") || "";
  assert(!loc.includes("/login/verify"), `demo must not hit 2FA, got ${loc}`);
  const demoPool = await request(demoJar, "/pool", { headers: { accept: "text/html" } });
  assert(demoPool.status === 200, `demo /pool ${demoPool.status}`);
  const demoForgot = await request(new Map(), "/api/password/forgot", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "gams@survivesunday.demo" }),
  });
  const demoForgotBody = await demoForgot.json();
  assert(demoForgot.ok && demoForgotBody.demo === true, "demo forgot is informational");
  console.log("PASS  demo login is one-step; demo reset is skipped");

  const stamp = Date.now();
  const email = `qa-reset-${stamp}@example.com`;
  const oldPass = "friendpass";
  const newPass = "newfriend";
  const join = await request(new Map(), "/api/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      inviteCode: "SUNDAY26",
      email,
      password: oldPass,
      nickname: `Reset ${stamp.toString().slice(-4)}`,
    }),
  });
  const joinBody = await join.json();
  assert(join.ok, `join ${join.status} ${JSON.stringify(joinBody)}`);

  const firstJar = new Map();
  const first = await credentialsLogin(firstJar, email, oldPass);
  assert(first?.user?.email === email, "old password works");
  assert(first.twoFactorPending !== true, "login must not require 2FA");
  const afterLogin = await request(firstJar, "/pool", {
    headers: { accept: "text/html" },
  });
  assert(afterLogin.status === 200, `signed-in /pool ${afterLogin.status}`);
  console.log("PASS  real user signs in without a second code");

  const forgot = await request(new Map(), "/api/password/forgot", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const sent = await forgot.json();
  assert(forgot.ok, `forgot ${forgot.status} ${JSON.stringify(sent)}`);
  assert(sent.channel === "email", `channel ${sent.channel}`);
  assert(typeof sent.devCode === "string" && sent.devCode.length === 6, "dev code");

  const bad = await request(new Map(), "/api/password/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      code: sent.devCode === "000000" ? "000001" : "000000",
      password: newPass,
    }),
  });
  assert(bad.status === 400, `wrong code ${bad.status}`);

  const good = await request(new Map(), "/api/password/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, code: sent.devCode, password: newPass }),
  });
  const goodBody = await good.json();
  assert(good.ok, `reset ${good.status} ${JSON.stringify(goodBody)}`);

  const oldJar = new Map();
  const oldSession = await credentialsLogin(oldJar, email, oldPass);
  assert(!oldSession?.user?.id, "old password must fail");

  const newJar = new Map();
  const newSession = await credentialsLogin(newJar, email, newPass);
  assert(newSession?.user?.email === email, "new password signs in");
  const pool = await request(newJar, "/pool", { headers: { accept: "text/html" } });
  assert(pool.status === 200, `reset /pool ${pool.status}`);
  console.log("PASS  OTP reset changes password; new password opens /pool");

  console.log("\nverify-password-reset-flow OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
