/**
 * Assert Auth.js default HTTPS cookies (Secure + __Secure-/__Host- names)
 * and that a credentials callback can mint a session token.
 *
 *   node scripts/verify-auth-https-cookies.mjs
 */
import { Auth, skipCSRFCheck } from "@auth/core";
import Credentials from "@auth/core/providers/credentials";

const SECRET = "test-auth-secret-for-https-cookie-check-32b";

function credentialsProvider() {
  return Credentials({
    id: "credentials",
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      if (credentials?.email === "gams@survivesunday.demo" && credentials?.password === "demo1234") {
        return { id: "user-gams", email: "gams@survivesunday.demo", name: "Gams" };
      }
      return null;
    },
  });
}

function config() {
  return {
    providers: [credentialsProvider()],
    session: { strategy: "jwt" },
    trustHost: true,
    secret: SECRET,
    basePath: "/api/auth",
    callbacks: {
      async jwt({ token, user }) {
        if (user) token.sub = user.id;
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) session.user.id = token.sub;
        return session;
      },
    },
  };
}

function cookieMap(res) {
  const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const names = set.map((c) => c.split("=")[0].trim());
  return { set, names, header: set.join("\n") };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const httpsReq = new Request("https://survive-sunday.example/api/auth/csrf", {
    headers: {
      host: "survive-sunday.example",
      "x-forwarded-proto": "https",
      "x-forwarded-host": "survive-sunday.example",
    },
  });
  const csrfRes = await Auth(httpsReq, config());
  assert(csrfRes.status === 200, `HTTPS CSRF status ${csrfRes.status}`);
  const csrfBody = await csrfRes.json();
  assert(typeof csrfBody.csrfToken === "string" && csrfBody.csrfToken.length > 0, "missing csrfToken");
  const csrfCookies = cookieMap(csrfRes);
  assert(
    csrfCookies.names.includes("__Host-authjs.csrf-token"),
    `expected __Host- CSRF cookie, got: ${csrfCookies.names.join(", ")}`
  );
  assert(
    csrfCookies.header.toLowerCase().includes("secure"),
    "HTTPS CSRF cookie must be Secure"
  );

  const missingSecret = await Auth(
    new Request("https://survive-sunday.example/api/auth/csrf", {
      headers: { host: "survive-sunday.example", "x-forwarded-proto": "https" },
    }),
    { ...config(), secret: undefined }
  );
  assert(missingSecret.status === 500, `missing secret should 500, got ${missingSecret.status}`);

  const callback = new Request(
    "https://survive-sunday.example/api/auth/callback/credentials",
    {
      method: "POST",
      headers: {
        host: "survive-sunday.example",
        "x-forwarded-proto": "https",
        "content-type": "application/x-www-form-urlencoded",
        cookie: csrfCookies.set.map((c) => c.split(";")[0]).join("; "),
      },
      body: new URLSearchParams({
        csrfToken: csrfBody.csrfToken,
        email: "gams@survivesunday.demo",
        password: "demo1234",
        callbackUrl: "/pool",
      }),
    }
  );
  const signInRes = await Auth(callback, {
    ...config(),
    skipCSRFCheck,
  });
  const signCookies = cookieMap(signInRes);
  const sessionCookie = signCookies.set.find((c) =>
    c.startsWith("__Secure-authjs.session-token=")
  );
  assert(
    !!sessionCookie,
    `expected __Secure- session cookie after credentials, got: ${signCookies.names.join(", ")} status=${signInRes.status}`
  );
  assert(sessionCookie.toLowerCase().includes("secure"), "session cookie must be Secure");

  const sessionRes = await Auth(
    new Request("https://survive-sunday.example/api/auth/session", {
      headers: {
        host: "survive-sunday.example",
        "x-forwarded-proto": "https",
        cookie: sessionCookie.split(";")[0],
      },
    }),
    config()
  );
  const session = await sessionRes.json();
  assert(session?.user?.id === "user-gams", `session user ${JSON.stringify(session)}`);

  console.log("PASS  HTTPS CSRF uses __Host-authjs.csrf-token");
  console.log("PASS  Missing AUTH_SECRET → 500 (not an empty session)");
  console.log("PASS  HTTPS credentials sign-in sets __Secure-authjs.session-token");
  console.log("PASS  Session reads back after HTTPS credentials login");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
