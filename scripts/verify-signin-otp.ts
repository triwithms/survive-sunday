/**
 * Sign-in OTP helpers stay deterministic and never throw on bad input.
 *
 *   npx tsx scripts/verify-signin-otp.ts
 */
import {
  OTP_PURPOSE_SIGN_IN,
  isSignInOtpPurpose,
  isDemoEmail,
} from "../src/lib/otp";
import {
  otpCopyKind,
  otpEmailSubject,
  otpSmsBody,
} from "../src/lib/otp-delivery";
import { requestSignInCode, userFromSignInOtp } from "../src/lib/signin-otp";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  assert(isSignInOtpPurpose(OTP_PURPOSE_SIGN_IN), "purpose constant");
  assert(otpCopyKind(OTP_PURPOSE_SIGN_IN) === "sign_in", "copy kind");
  assert(
    otpEmailSubject("sign_in").toLowerCase().includes("sign-in"),
    "email subject"
  );
  assert(
    otpSmsBody("123456", "sign_in").includes("sign-in"),
    "sms body"
  );
  assert(
    otpEmailSubject("password_reset").toLowerCase().includes("password"),
    "reset subject unchanged"
  );
  assert(isDemoEmail("gams@survivesunday.demo"), "demo email");

  const demo = await requestSignInCode("gams@survivesunday.demo");
  assert(demo.ok && "demo" in demo && demo.demo === true, "demo code is a no-op");

  const bad = await userFromSignInOtp("friend@example.com", "12");
  assert(bad === null, "short code is null, not throw");
  const empty = await userFromSignInOtp("", "123456");
  assert(empty === null, "empty email is null");
  const demoVerify = await userFromSignInOtp("gams@survivesunday.demo", "123456");
  assert(demoVerify === null, "demo cannot sign in via OTP");

  console.log("verify-signin-otp OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
