/**
 * Primary Sign in UI is email + password + Forgot password only.
 *
 *   npx tsx scripts/verify-login-screen.ts
 */
import { existsSync, readdirSync, readFileSync } from "fs";
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
  const auth = readFileSync(join("src/lib/auth.ts"), "utf8");
  const loginApi = readFileSync(join("src/app/api/login/route.ts"), "utf8");

  assert(login.includes("Forgot password?"), "Forgot password link");
  assert(login.includes('name="email"'), "email field");
  assert(login.includes('name="password"'), "password field");
  assert(login.includes("useInvitePrefill"), "invite token prefill hook");
  assert(login.includes("InviteGreeting"), "invite greeting");
  assert(!login.includes("params.get(\"password\")"), "never read password from URL");
  assert(login.includes("Email or username"), "email or username label");
  assert(!login.includes("← Survive Sunday"), "no back-link chrome");
  assert(!/Join the pool|Who are you/i.test(login), "no Join CTA");
  assert(login.includes("Sign in"), "Sign in button");
  assert(!/Google|Continue with/i.test(login), "no Google on Sign in");
  assert(!login.includes("SignInCodeForm"), "no OTP form");
  assert(!login.includes("Email me a sign-in code"), "no OTP-first CTA");
  assert(!login.includes("Use password instead"), "no password toggle");
  assert(!login.includes("DemoEnter"), "no demo picker");
  assert(!page.includes("demoMode"), "login page does not load demo picker");
  assert(/spam\/junk/.test(copy), "forgot copy mentions spam/junk");
  assert(!/Send to my phone/i.test(actions), "no SMS-first toggle on Forgot");
  assert(!/Google|userFromSignInOtp|\botp\b/.test(auth), "auth is password-only");
  assert(!/\botp\b/.test(loginApi), "login API does not accept OTP");
  assert(
    !existsSync(join("src/components/SignInCodeForm.tsx")),
    "SignInCodeForm removed"
  );
  assert(
    !existsSync(join("src/app/api/login/code/route.ts")),
    "sign-in OTP API removed"
  );
  assert(!existsSync(join("src/lib/signin-otp.ts")), "signin-otp module removed");
  const landing = readFileSync(join("src/app/page.tsx"), "utf8");
  const joinPage = readFileSync(join("src/app/join/page.tsx"), "utf8");
  const joinDir = "src/components/features/join";
  const joinSrc = readdirSync(joinDir)
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => readFileSync(join(joinDir, name), "utf8"))
    .join("\n");

  assert(landing.includes('redirect("/login")'), "cold / goes to Sign in");
  assert(!/WhoAreYou|Who are you/.test(landing), "no people list on /");
  assert(joinPage.includes('redirect("/login")'), "signed-out /join → Sign in");
  assert(!joinSrc.includes("WhoAreYouSelect"), "Join has no roster picker");
  assert(!joinSrc.includes("roster list"), "Join has no roster-list toggle");
  assert(!joinSrc.includes("oneTapClaim"), "Join has no one-tap claim");
  assert(!/one tap|with one tap/i.test(joinSrc), "Join copy is not passwordless");
  assert(
    !existsSync(join("src/components/WhoAreYouCard.tsx")),
    "WhoAreYouCard removed"
  );
  assert(
    !existsSync(join("src/components/WhoAreYouSelect.tsx")),
    "WhoAreYouSelect removed"
  );
  assertCap("src/components/features/login");
  assertCap(joinDir);
  assertCap("src/lib", 100, /^password-reset/);
  console.log("PASS  Sign in is email + password + Forgot password");
}

main();
