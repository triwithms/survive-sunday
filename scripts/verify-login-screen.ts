/**
 * Primary Sign in UI is email + password + Forgot password only.
 *
 *   npx tsx scripts/verify-login-screen.ts
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  entryPathAvoidingJoinTrap,
  isNextRedirect,
  loginReturnForInvite,
  signedInLoginRedirect,
} from "../src/lib/entry-path";

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
  assert(!login.includes("/api/demo-enter"), "Sign in does not post to demo-enter");
  assert(!login.includes("/api/demo-login"), "Sign in does not post to demo-login");
  assert(
    !existsSync(join("src/app/api/demo-enter/route.ts")),
    "demo-enter route removed"
  );
  assert(
    !existsSync(join("src/app/api/demo-login/route.ts")),
    "demo-login route removed"
  );
  assert(!existsSync(join("src/lib/demo-account.ts")), "demo account seeder removed");
  assert(!existsSync(join("src/lib/demo-session.ts")), "demo session helper removed");
  assert(
    !existsSync(join("scripts/verify-demo-enter.mjs")),
    "demo-enter verify script removed"
  );
  assert(loginApi.includes("signInWithCredentials"), "live login uses credentials sign-in");
  assert(!loginApi.includes("demo-session"), "login API does not use the demo helper");
  const resetCopy = readFileSync(join("src/lib/password-reset.ts"), "utf8");
  const forgotSend = readFileSync(
    join("src/components/features/login/forgot-send.ts"),
    "utf8"
  );
  assert(!resetCopy.includes("demo1234"), "reset copy does not publish a practice password");
  assert(!/picker/i.test(resetCopy), "reset copy does not point at a demo picker");
  assert(!forgotSend.includes("demo1234"), "forgot UI does not publish a practice password");
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
  assert(
    landing.includes("entryPathAvoidingJoinTrap"),
    "signed-in / does not send a seatless session to Join"
  );
  assert(landing.includes("isNextRedirect"), "home rethrows redirect()");
  assert(!/WhoAreYou|Who are you/.test(landing), "no people list on /");
  assert(joinPage.includes('redirect("/login")'), "signed-out /join → Sign in");
  assert(
    page.includes("signedInLoginRedirect"),
    "Sign in stays when the only next step is Join"
  );
  assert(
    !page.includes("redirect(await pathAfterLogin"),
    "login does not always follow pathAfterLogin"
  );
  const joinForm = readFileSync(
    join("src/components/features/join/JoinForm.tsx"),
    "utf8"
  );
  const claimed = readFileSync(
    join("src/components/features/join/JoinClaimedSeat.tsx"),
    "utf8"
  );
  const joinHook = readFileSync(
    join("src/components/features/join/use-join-form.ts"),
    "utf8"
  );
  assert(joinForm.includes('href="/login"'), "Join Sign in and back use /login");
  assert(!joinForm.includes('href="/"'), "Join back is not home");
  assert(!joinForm.includes("next/link"), "Join exit is a full document load");
  assert(claimed.includes('href="/login"'), "claimed seat exits to /login");
  assert(!claimed.includes('href="/"'), "claimed seat back is not home");
  assert(
    joinHook.includes('window.location.assign("/login")'),
    "Escape leaves Join for Sign in"
  );
  assert(entryPathAvoidingJoinTrap("/join") === "/login", "seatless entry is Sign in");
  assert(
    entryPathAvoidingJoinTrap("/join?who=gams") === "/login",
    "seatless invite entry is Sign in"
  );
  assert(entryPathAvoidingJoinTrap("/pick") === "/pick", "pool seat still opens My pick");
  assert(
    entryPathAvoidingJoinTrap("/welcome") === "/welcome",
    "incomplete profile still opens Welcome"
  );
  assert(signedInLoginRedirect("/join") === null, "Sign in does not bounce to Join");
  assert(signedInLoginRedirect("/pick") === "/pick", "member leaves Sign in for My pick");
  assert(
    signedInLoginRedirect("/welcome") === "/welcome",
    "incomplete profile leaves Sign in for Welcome"
  );
  assert(
    isNextRedirect(
      Object.assign(new Error("NEXT_REDIRECT"), {
        digest: "NEXT_REDIRECT;replace;/pick;307;",
      })
    ),
    "redirect() is rethrown"
  );
  assert(!isNextRedirect(new Error("db down")), "db errors are not redirects");
  assert(loginReturnForInvite({}) === "/login", "bare Join returns to Sign in");
  assert(
    decodeURIComponent(loginReturnForInvite({ seat: "mem-1" })).includes(
      "/join?seat=mem-1"
    ),
    "seat invite survives Sign in"
  );
  assert(
    decodeURIComponent(loginReturnForInvite({ token: "abc" })).includes(
      "/join?t=abc"
    ),
    "token invite survives Sign in"
  );
  const afterLogin = readFileSync(join("src/lib/path-after-login.ts"), "utf8");
  assert(
    !afterLogin.includes('return "/join"'),
    "pathAfterLogin does not open the code Join screen"
  );
  assert(
    afterLogin.includes("SIGNED_IN_NO_POOL_PATH"),
    "no pool seat stays on Sign in"
  );
  const fields = readFileSync(
    join("src/components/features/join/JoinFields.tsx"),
    "utf8"
  );
  assert(!fields.includes("Invite code"), "no invite-code field");
  assert(!joinSrc.includes("Choose a nickname"), "no public nickname join");
  assert(!joinSrc.includes("Invite code"), "join UI has no invite code");
  assert(joinSrc.includes('action="/api/logout"'), "Sign in on Join signs out first");
  const appLoad = readFileSync(
    join("src/app/(app)/load-app-membership.ts"),
    "utf8"
  );
  assert(!appLoad.includes('redirect("/join")'), "app entry does not open Join");
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
