/**
 * End-to-end 2FA: demo skips it; a real join+login must complete a code.
 *
 *   BASE_URL=http://127.0.0.1:3000 node scripts/verify-two-factor-flow.mjs
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
  const sessionRes = await request(jar, "/api/auth/session");
  return sessionRes.json();
}

async function main() {
  console.log(`verify-two-factor-flow against ${BASE}\n`);

  const demoJar = new Map();
  const enter = await request(demoJar, "/api/demo-enter", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      email: "gams@survivesunday.demo",
      password: "demo1234",
    }),
  });
  assert([302, 303, 307].includes(enter.status), `demo-enter status ${enter.status}`);
  const demoSession = await (await request(demoJar, "/api/auth/session")).json();
  assert(demoSession?.user?.email === "gams@survivesunday.demo", "demo session");
  assert(
    demoSession.twoFactorPending !== true,
    `demo should skip 2FA, got ${JSON.stringify(demoSession)}`
  );
  const demoPool = await request(demoJar, "/pool", { headers: { accept: "text/html" } });
  assert(demoPool.status === 200, `demo /pool ${demoPool.status}`);
  const demoLoc = demoPool.headers.get("location") || "";
  assert(!demoLoc.includes("/login/verify"), `demo redirected to ${demoLoc}`);
  console.log("PASS  demo Gams skips 2FA and reaches /pool");

  const stamp = Date.now();
  const email = `qa-2fa-${stamp}@example.com`;
  const password = "friendpass";
  const joinJar = new Map();
  const join = await request(joinJar, "/api/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      inviteCode: "SUNDAY26",
      email,
      password,
      nickname: `QA ${stamp.toString().slice(-4)}`,
      realName: "QA Two Factor",
    }),
  });
  const joinBody = await join.json();
  assert(join.ok, `join failed ${join.status} ${JSON.stringify(joinBody)}`);

  const realJar = new Map();
  const session1 = await credentialsLogin(realJar, email, password);
  assert(session1?.user?.email === email, `real session ${JSON.stringify(session1)}`);
  assert(session1.twoFactorPending === true, `expected pending 2FA, got ${JSON.stringify(session1)}`);
  const blocked = await request(realJar, "/pool", { headers: { accept: "text/html" } });
  const blockedTo = blocked.headers.get("location") || "";
  assert(
    blocked.status === 307 || blocked.status === 303 || blocked.status === 302,
    `pending /pool status ${blocked.status}`
  );
  assert(blockedTo.includes("/login/verify"), `pending /pool → ${blockedTo}`);
  console.log("PASS  real user is pending and cannot open /pool");

  const send = await request(realJar, "/api/2fa/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const sent = await send.json();
  assert(send.ok, `send failed ${send.status} ${JSON.stringify(sent)}`);
  assert(sent.channel === "email", `expected email channel, got ${sent.channel}`);
  assert(typeof sent.devCode === "string" && sent.devCode.length === 6, "dev code missing");
  console.log(`PASS  emailed stub code ${sent.destinationMasked}`);

  const bad = await request(realJar, "/api/2fa/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: sent.devCode === "000000" ? "000001" : "000000" }),
  });
  assert(bad.status === 400, `wrong code status ${bad.status}`);
  const stillPending = await (await request(realJar, "/api/auth/session")).json();
  assert(stillPending.twoFactorPending === true, "wrong code must not complete session");
  console.log("PASS  wrong code rejected");

  const good = await request(realJar, "/api/2fa/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: sent.devCode }),
  });
  const goodBody = await good.json();
  assert(good.ok, `verify failed ${good.status} ${JSON.stringify(goodBody)}`);
  const session2 = await (await request(realJar, "/api/auth/session")).json();
  assert(session2.twoFactorPending !== true, `still pending after verify: ${JSON.stringify(session2)}`);
  const pool = await request(realJar, "/pool", { headers: { accept: "text/html" } });
  assert(pool.status === 200, `verified /pool ${pool.status} loc=${pool.headers.get("location")}`);
  console.log("PASS  correct code completes session and opens /pool");

  const phone = await request(realJar, "/api/user/phone", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: "+14169514262" }),
  });
  const phoneBody = await phone.json();
  assert(phone.ok, `phone save ${phone.status} ${JSON.stringify(phoneBody)}`);

  const againJar = new Map();
  const session3 = await credentialsLogin(againJar, email, password);
  assert(session3.twoFactorPending === true, "second login must ask for 2FA again");
  const sendSms = await request(againJar, "/api/2fa/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const sms = await sendSms.json();
  assert(sendSms.ok, `sms send ${sendSms.status} ${JSON.stringify(sms)}`);
  assert(sms.channel === "sms", `expected sms after phone saved, got ${sms.channel}`);
  assert(sms.canEmail === true && sms.canSms === true, "both channels offered");
  const sendEmail = await request(againJar, "/api/2fa/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel: "email" }),
  });
  const emailed = await sendEmail.json();
  assert(sendEmail.ok, `email switch ${sendEmail.status} ${JSON.stringify(emailed)}`);
  assert(emailed.channel === "email", `switch to email got ${emailed.channel}`);
  const finish = await request(againJar, "/api/2fa/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: emailed.devCode }),
  });
  assert(finish.ok, `email-code verify ${finish.status}`);
  console.log("PASS  stored phone prefers SMS; send-to-email still works");

  console.log("\nverify-two-factor-flow OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
