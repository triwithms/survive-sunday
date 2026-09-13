/**
 * rewriteAuthResponse must keep each Set-Cookie intact (Safari).
 *
 *   npx tsx scripts/verify-auth-rewrite.ts
 */
import { rewriteAuthResponse } from "../src/lib/request-host";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  const session =
    "__Secure-authjs.session-token=abc123; Path=/; Expires=Sun, 13 Dec 2026 16:00:00 GMT; HttpOnly; Secure; SameSite=Lax";
  const csrf =
    "__Host-authjs.csrf-token=xyz; Path=/; Secure; HttpOnly; SameSite=Lax";
  const callback =
    "__Secure-authjs.callback-url=https://localhost:3000/pool; Path=/; Secure; SameSite=Lax";

  const res = new Response(null, {
    status: 302,
    headers: [
      ["location", "https://localhost:3000/pool"],
      ["set-cookie", session],
      ["set-cookie", csrf],
      ["set-cookie", callback],
    ],
  });

  const req = new Request(
    "https://survive-sunday.vercel.app/api/auth/callback/credentials",
    {
      headers: {
        host: "survive-sunday.vercel.app",
        "x-forwarded-host": "survive-sunday.vercel.app",
        "x-forwarded-proto": "https",
      },
    }
  );

  const out = rewriteAuthResponse(req, res);
  const cookies = out.headers.getSetCookie();
  assert(cookies.length === 3, `expected 3 Set-Cookie, got ${cookies.length}: ${cookies.join(" || ")}`);

  const sessionOut = cookies.find((c) =>
    c.startsWith("__Secure-authjs.session-token=")
  );
  assert(!!sessionOut, "session cookie missing after rewrite");
  assert(
    sessionOut!.includes("Expires=Sun, 13 Dec 2026 16:00:00 GMT"),
    `Expires comma must stay inside one cookie: ${sessionOut}`
  );
  assert(
    !sessionOut!.includes("__Host-authjs.csrf-token"),
    "session cookie must not be merged with CSRF"
  );

  const callbackOut = cookies.find((c) =>
    c.startsWith("__Secure-authjs.callback-url=")
  );
  assert(!!callbackOut, "callback-url cookie missing");
  assert(
    decodeURIComponent(callbackOut!).includes(
      "https://survive-sunday.vercel.app/pool"
    ),
    `callback-url should follow public Host: ${callbackOut}`
  );
  assert(
    !callbackOut!.includes("localhost"),
    `callback-url still localhost: ${callbackOut}`
  );

  assert(
    out.headers.get("location") === "https://survive-sunday.vercel.app/pool",
    `Location ${out.headers.get("location")}`
  );

  console.log("PASS  rewriteAuthResponse keeps separate Set-Cookie headers");
}

main();
