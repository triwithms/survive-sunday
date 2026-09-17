/**
 * Primary Sign in UI is email + password + Forgot password only.
 *
 *   npx tsx scripts/verify-login-screen.ts
 */
import { readFileSync } from "fs";
import { join } from "path";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  const login = readFileSync(
    join("src/components/features/login/LoginForm.tsx"),
    "utf8"
  );
  const page = readFileSync(join("src/app/login/page.tsx"), "utf8");
  const copy = readFileSync(
    join("src/components/features/login/forgot-copy.ts"),
    "utf8"
  );

  assert(login.includes("Forgot password?"), "Forgot password link");
  assert(login.includes('name="email"'), "email field");
  assert(login.includes('name="password"'), "password field");
  assert(login.includes("Sign in"), "Sign in button");
  assert(!/Google|Continue with/i.test(login), "no Google on Sign in");
  assert(!login.includes("SignInCodeForm"), "no OTP form");
  assert(!login.includes("Email me a sign-in code"), "no OTP-first CTA");
  assert(!login.includes("Use password instead"), "no password toggle");
  assert(!login.includes("DemoEnter"), "no demo picker");
  assert(!page.includes("demoMode"), "login page does not load demo picker");
  assert(/spam\/junk/.test(copy), "forgot copy mentions spam/junk");
  console.log("PASS  Sign in is email + password + Forgot password");
}

main();
