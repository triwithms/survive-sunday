/**
 * authorize() must not throw when the user lookup fails — Auth.js maps
 * that throw to CallbackRouteError.
 *
 *   npx tsx scripts/verify-credentials-authorize.ts
 */
import { Auth, skipCSRFCheck } from "@auth/core";
import Credentials from "@auth/core/providers/credentials";
import { userFromCredentials } from "../src/lib/credentials-user";
import { prismaDatasourceUrl } from "../src/lib/prisma-url";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const thrown = await userFromCredentials(
    "gams@survivesunday.demo",
    "demo1234",
    async () => {
      throw new Error("simulated Prisma engine / connection failure");
    }
  );
  assert(thrown === null, "throwing lookup must return null, not throw");
  console.log("PASS  throwing user lookup → null (no CallbackRouteError)");

  const missing = await userFromCredentials(
    "gams@survivesunday.demo",
    "demo1234",
    async () => null
  );
  assert(missing === null, "missing user must be null");
  console.log("PASS  missing user → null (CredentialsSignin, not CallbackRouteError)");

  const pooled = prismaDatasourceUrl(
    "postgresql://u:p@ep-foo-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"
  );
  assert(!!pooled && pooled.includes("pgbouncer=true"), `pooler URL ${pooled}`);
  assert(!!pooled && pooled.includes("connection_limit=1"), `limit ${pooled}`);
  const local = prismaDatasourceUrl("postgresql://survive:survive@127.0.0.1:5432/survive");
  assert(!!local && local.includes("connection_limit=1"), `local ${local}`);
  assert(!!local && !local.includes("pgbouncer"), `local should not set pgbouncer: ${local}`);
  console.log("PASS  Neon pooler URL gets pgbouncer + connection_limit");

  const SECRET = "test-auth-secret-for-callback-route-32b";
  const host = "survive-sunday.vercel.app";
  const authConfig = {
    providers: [
      Credentials({
        id: "credentials",
        credentials: { email: {}, password: {} },
        async authorize(credentials) {
          return userFromCredentials(
            String(credentials?.email ?? ""),
            String(credentials?.password ?? ""),
            async () => {
              throw new Error("simulated Prisma engine / connection failure");
            }
          );
        },
      }),
    ],
    session: { strategy: "jwt" as const },
    trustHost: true,
    secret: SECRET,
    basePath: "/api/auth",
  };

  const res = await Auth(
    new Request(`https://${host}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        host,
        "x-forwarded-proto": "https",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: "gams@survivesunday.demo",
        password: "demo1234",
        callbackUrl: "/pool",
      }),
    }),
    { ...authConfig, skipCSRFCheck }
  );
  const location = res.headers.get("Location") ?? "";
  assert(
    !/CallbackRouteError|Configuration/.test(location),
    `credentials callback Location ${location}`
  );
  assert(
    /error=CredentialsSignin/.test(location),
    `expected CredentialsSignin redirect, got ${location} status=${res.status}`
  );
  console.log("PASS  Auth.js credentials callback is CredentialsSignin, not CallbackRouteError");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
