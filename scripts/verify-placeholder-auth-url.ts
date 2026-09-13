/**
 * A leftover AUTH_URL=https://example.com must not pin Auth.js.
 *
 *   npx tsx scripts/verify-placeholder-auth-url.ts
 */
import { Auth, skipCSRFCheck } from "@auth/core";
import Credentials from "@auth/core/providers/credentials";
import {
  isIgnoredAuthUrl,
  isPlaceholderAuthHost,
  rewriteUrlToOrigin,
  stripIgnoredAuthUrlEnv,
} from "../src/lib/request-host";

const SECRET = "test-auth-secret-for-placeholder-url-32b";
const PUBLIC_HOST = "survive-sunday.vercel.app";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function credentialsProvider() {
  return Credentials({
    id: "credentials",
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      if (
        credentials?.email === "gams@survivesunday.demo" &&
        credentials?.password === "demo1234"
      ) {
        return {
          id: "user-gams",
          email: "gams@survivesunday.demo",
          name: "Gams",
        };
      }
      return null;
    },
  });
}

function config() {
  return {
    providers: [credentialsProvider()],
    session: { strategy: "jwt" as const },
    trustHost: true,
    secret: SECRET,
    basePath: "/api/auth",
    callbacks: {
      async jwt({ token, user }) {
        if (user?.id) token.sub = user.id;
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) session.user.id = token.sub;
        return session;
      },
    },
  };
}

function cookieMap(res: Response) {
  const set =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return { set, names: set.map((c) => c.split("=")[0].trim()) };
}

async function main() {
  assert(isPlaceholderAuthHost("example.com"), "example.com");
  assert(isPlaceholderAuthHost("EXAMPLE.COM:443"), "EXAMPLE.COM:443");
  assert(isPlaceholderAuthHost("www.example.com"), "www.example.com");
  assert(isPlaceholderAuthHost("example.org"), "example.org");
  assert(isPlaceholderAuthHost("www.example.net"), "www.example.net");
  assert(isIgnoredAuthUrl("https://example.com"), "https://example.com");
  assert(isIgnoredAuthUrl("http://example.com/path"), "http://example.com/path");
  assert(isIgnoredAuthUrl("https://localhost:3000"), "localhost still ignored");
  assert(!isIgnoredAuthUrl("https://survive-sunday.vercel.app"), "real prod URL kept");
  assert(!isIgnoredAuthUrl("https://great-sloths-fetch.loca.lt"), "tunnel URL kept");
  assert(
    rewriteUrlToOrigin("https://example.com/pool", "https://survive-sunday.vercel.app") ===
      "https://survive-sunday.vercel.app/pool",
    "rewrite example.com Location"
  );
  console.log("PASS  placeholder / loopback AUTH_URL detection");

  const env: Record<string, string | undefined> = {
    AUTH_URL: "https://example.com",
    NEXTAUTH_URL: "https://www.example.org",
    AUTH_TRUST_HOST: "true",
  };
  stripIgnoredAuthUrlEnv(env);
  assert(!env.AUTH_URL, `AUTH_URL still ${env.AUTH_URL}`);
  assert(!env.NEXTAUTH_URL, `NEXTAUTH_URL still ${env.NEXTAUTH_URL}`);

  const keep: Record<string, string | undefined> = {
    AUTH_URL: "https://survive-sunday.vercel.app",
  };
  stripIgnoredAuthUrlEnv(keep);
  assert(
    keep.AUTH_URL === "https://survive-sunday.vercel.app",
    "must keep a real AUTH_URL"
  );
  console.log("PASS  stripIgnoredAuthUrlEnv drops example.* and keeps real URLs");

  process.env.AUTH_URL = "https://example.com";
  process.env.NEXTAUTH_URL = "https://example.com";
  stripIgnoredAuthUrlEnv();
  assert(!process.env.AUTH_URL, "process.env.AUTH_URL not cleared");
  assert(!process.env.NEXTAUTH_URL, "process.env.NEXTAUTH_URL not cleared");

  const httpsReq = new Request(`https://${PUBLIC_HOST}/api/auth/csrf`, {
    headers: {
      host: PUBLIC_HOST,
      "x-forwarded-proto": "https",
      "x-forwarded-host": PUBLIC_HOST,
    },
  });
  const csrfRes = await Auth(httpsReq, config());
  assert(csrfRes.status === 200, `CSRF ${csrfRes.status} with leftover example.com AUTH_URL`);
  const csrfBody = (await csrfRes.json()) as { csrfToken?: string };
  assert(typeof csrfBody.csrfToken === "string" && csrfBody.csrfToken.length > 0, "csrfToken");
  const csrfCookies = cookieMap(csrfRes);
  assert(
    csrfCookies.names.includes("__Host-authjs.csrf-token"),
    `CSRF cookies ${csrfCookies.names.join(", ")}`
  );

  const signInRes = await Auth(
    new Request(`https://${PUBLIC_HOST}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        host: PUBLIC_HOST,
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
    }),
    { ...config(), skipCSRFCheck }
  );
  const signCookies = cookieMap(signInRes);
  const sessionCookie = signCookies.set.find((c) =>
    c.startsWith("__Secure-authjs.session-token=")
  );
  assert(
    !!sessionCookie,
    `expected session cookie after example.com AUTH_URL strip, got ${signCookies.names.join(", ")}`
  );

  const sessionRes = await Auth(
    new Request(`https://${PUBLIC_HOST}/api/auth/session`, {
      headers: {
        host: PUBLIC_HOST,
        "x-forwarded-proto": "https",
        cookie: sessionCookie.split(";")[0],
      },
    }),
    config()
  );
  const session = (await sessionRes.json()) as { user?: { id?: string } };
  assert(session?.user?.id === "user-gams", `session ${JSON.stringify(session)}`);
  console.log("PASS  CSRF + credentials session after AUTH_URL=https://example.com");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
