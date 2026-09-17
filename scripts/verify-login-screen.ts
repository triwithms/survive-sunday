/**
 * Primary Sign in UI is email + password + Forgot password only.
 *
 *   npx tsx scripts/verify-login-screen.ts
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  if (!text) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function assertCap(dir: string, cap = 100, only?: RegExp) {
  for (const name of readdirSync(dir)) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    if (only && !only.test(name)) continue;
    const path = join(dir, name);
    const n = lineCount(path);
    assert(n <= cap, `${path} is ${n} lines (max ${cap})`);
  }
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
  const actions = readFileSync(
    join("src/components/features/login/ForgotCodeActions.tsx"),
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
  assert(!/Send to my phone/i.test(actions), "no SMS-first toggle on Forgot");
  assertCap("src/components/features/login");
  assertCap("src/lib", 100, /^password-reset/);
  console.log("PASS  Sign in is email + password + Forgot password");
}

main();
