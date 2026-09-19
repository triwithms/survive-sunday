/**
 * Login error copy + callback sanitizer.
 *
 *   npx tsx scripts/verify-login-error.ts
 */
import {
  friendlyLoginError,
  loginEmailQueryValue,
  loginFailurePath,
  safeLoginCallbackPath,
} from "../src/lib/login-error";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  assert(
    friendlyLoginError("CredentialsSignin")?.includes("password"),
    "CredentialsSignin must mention password"
  );
  assert(
    friendlyLoginError("OtpSignin")?.toLowerCase().includes("code"),
    "OtpSignin must mention the sign-in code"
  );
  assert(
    friendlyLoginError("NoSession")?.toLowerCase().includes("phone") ||
      (friendlyLoginError("NoSession")?.toLowerCase().includes("signed") ??
        false),
    "NoSession must be plain English"
  );
  assert(
    friendlyLoginError("Configuration")?.includes("server"),
    "Configuration maps to server problem"
  );
  assert(
    friendlyLoginError("CallbackRouteError")?.includes("server"),
    "CallbackRouteError maps to server problem"
  );
  assert(
    friendlyLoginError("nope")?.includes("did not work"),
    "unknown codes get a generic message"
  );
  assert(friendlyLoginError("") === null, "empty code is no banner");
  assert(friendlyLoginError(null) === null, "null code is no banner");

  assert(
    loginEmailQueryValue("RobertGama@gmail.com") === "robertgama@gmail.com",
    "email kept and lowercased"
  );
  assert(loginEmailQueryValue("Gams") === "Gams", "keep username");
  assert(loginEmailQueryValue("https://evil") === "", "reject urls");
  assert(
    loginFailurePath("CredentialsSignin", "robertgama@gmail.com") ===
      "/login?error=CredentialsSignin&email=robertgama%40gmail.com",
    `failure path ${loginFailurePath("CredentialsSignin", "robertgama@gmail.com")}`
  );

  assert(safeLoginCallbackPath("/pool") === "/pool", "/pool ok");
  assert(safeLoginCallbackPath("/pick") === "/pick", "/pick ok");
  assert(safeLoginCallbackPath("/admin") === "/admin", "/admin ok");
  assert(
    safeLoginCallbackPath("https://evil.example/pool") === "/pick",
    "reject absolute URL"
  );
  assert(safeLoginCallbackPath("//evil.example") === "/pick", "reject protocol-relative");
  assert(safeLoginCallbackPath("/login") === "/pick", "reject /login loop");
  assert(safeLoginCallbackPath("/api/auth/signin") === "/pick", "reject /api");
  console.log("PASS  login error copy and URL helpers");
}

main();
