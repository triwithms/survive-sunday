/**
 * Password-reset OTP helpers stay deterministic and never throw on bad input.
 *
 *   npx tsx scripts/verify-password-reset.ts
 */
import {
  OTP,
  expirySeconds,
  generateOtpCode,
  hashSecret,
  isDemoEmail,
  isValidOtpShape,
  maskEmail,
  maskPhone,
  normalizeEmail,
  normalizeOtpInput,
  parseChannel,
  preferredChannel,
  secondsUntil,
  secretsMatch,
} from "../src/lib/otp";
import { requestPasswordReset, resetPasswordWithCode } from "../src/lib/password-reset";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  assert(isDemoEmail("gams@survivesunday.demo"), "gams is demo");
  assert(isDemoEmail("ADMIN@SurviveSunday.demo"), "demo case");
  assert(isDemoEmail("go-giants@pending.survivesunday.local"), "pending placeholder");
  assert(!isDemoEmail("friend@example.com"), "real email");
  assert(!isDemoEmail("robertgama@gmail.com"), "gams claimed email");
  assert(normalizeEmail(" Pat@Example.com ") === "pat@example.com", "normalize email");
  console.log("PASS  demo + email helpers");

  const code = generateOtpCode();
  assert(code.length === OTP.codeLength && /^\d+$/.test(code), `otp ${code}`);
  const hash = hashSecret(code, "otp");
  assert(secretsMatch(code, "otp", hash), "hash matches");
  assert(!secretsMatch("000000" === code ? "000001" : "000000", "otp", hash), "wrong code fails");
  assert(normalizeOtpInput("12 34-56") === "123456", "normalize");
  assert(isValidOtpShape("123456") && !isValidOtpShape("12345"), "shape");
  assert(preferredChannel(true, null) === "sms", "prefer sms");
  assert(preferredChannel(false, "sms") === "email", "no phone → email");
  assert(parseChannel("nope") === null, "parse junk");
  assert(maskEmail("pat@example.com") === "p•••@example.com", "mask email");
  assert(maskPhone("+14169514262") === "+1 •••-•••-4262", "mask phone");
  assert(secondsUntil(new Date(Date.now() - 10_000), 45_000) === 35, "cooldown");
  assert(expirySeconds(new Date(Date.now() + 90_000)) === 90, "expiry");
  console.log("PASS  otp helpers");

  const demo = await requestPasswordReset("gams@survivesunday.demo");
  assert(demo.ok && "demo" in demo && demo.demo === true, "demo reset is a no-op");
  const demoReset = await resetPasswordWithCode(
    "gams@survivesunday.demo",
    "123456",
    "newpass"
  );
  assert(!demoReset.ok, "demo cannot change password via reset");
  console.log("PASS  demo seats skip reset");

  console.log("\nverify-password-reset OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
