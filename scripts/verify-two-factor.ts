/**
 * Two-factor helpers must stay deterministic and never throw on bad input.
 *
 *   npx tsx scripts/verify-two-factor.ts
 */
import {
  TWO_FACTOR,
  expirySeconds,
  generateGrantToken,
  generateOtpCode,
  hashSecret,
  isDemoEmail,
  isTwoFactorEnabled,
  isValidOtpShape,
  maskDestination,
  maskEmail,
  maskPhone,
  normalizeOtpInput,
  parseChannel,
  preferredChannel,
  requiresTwoFactor,
  secondsUntil,
  secretsMatch,
} from "../src/lib/two-factor";
import { userFromTwoFactorGrant } from "../src/lib/two-factor-service";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  assert(isDemoEmail("gams@survivesunday.demo"), "gams is demo");
  assert(isDemoEmail("ADMIN@SurviveSunday.demo"), "demo match is case-insensitive");
  assert(!isDemoEmail("robertgama@gmail.com"), "real email is not demo");
  assert(!isDemoEmail(""), "empty is not demo");

  const prev = process.env.TWO_FACTOR_ENABLED;
  delete process.env.TWO_FACTOR_ENABLED;
  assert(isTwoFactorEnabled(), "2FA defaults on");
  assert(requiresTwoFactor("friend@example.com"), "real users need 2FA");
  assert(!requiresTwoFactor("gams@survivesunday.demo"), "demo skips 2FA");

  process.env.TWO_FACTOR_ENABLED = "false";
  assert(!isTwoFactorEnabled(), "TWO_FACTOR_ENABLED=false disables");
  assert(!requiresTwoFactor("friend@example.com"), "kill switch skips real users");
  if (prev == null) delete process.env.TWO_FACTOR_ENABLED;
  else process.env.TWO_FACTOR_ENABLED = prev;
  console.log("PASS  demo skip + enable flag");

  const code = generateOtpCode();
  assert(code.length === TWO_FACTOR.codeLength, `otp length ${code}`);
  assert(/^\d+$/.test(code), `otp digits ${code}`);
  const hash = hashSecret(code, "otp");
  assert(secretsMatch(code, "otp", hash), "otp hash matches");
  assert(!secretsMatch("000000" === code ? "000001" : "000000", "otp", hash), "wrong code fails");
  assert(!secretsMatch(code, "other-salt", hash), "wrong salt fails");
  assert(!secretsMatch(code, "otp", "not-a-hash"), "junk hash fails");
  assert(generateGrantToken().length === 64, "grant token is 32 bytes hex");
  console.log("PASS  generate + hmac compare");

  assert(normalizeOtpInput("12 34-56") === "123456", "normalize strips junk");
  assert(isValidOtpShape("123456"), "valid shape");
  assert(!isValidOtpShape("12345"), "too short");
  assert(!isValidOtpShape("1234567"), "too long");
  assert(parseChannel("sms") === "sms", "parse sms");
  assert(parseChannel("nope") === null, "parse junk");
  assert(preferredChannel(true, null) === "sms", "prefer sms when phone exists");
  assert(preferredChannel(false, "sms") === "email", "no phone falls back to email");
  assert(preferredChannel(true, "email") === "email", "explicit email");
  console.log("PASS  input + channel helpers");

  assert(maskEmail("robertgama@gmail.com") === "r•••@gmail.com", `mask email`);
  assert(maskPhone("+14169514262") === "+1 •••-•••-4262", `mask phone`);
  assert(maskDestination("email", "a@b.ca") === "a•••@b.ca", "mask dest email");
  assert(secondsUntil(new Date(Date.now() - 10_000), 45_000) === 35, "cooldown remaining");
  assert(secondsUntil(new Date(Date.now() - 60_000), 45_000) === 0, "cooldown done");
  assert(expirySeconds(new Date(Date.now() + 90_000)) === 90, "expiry seconds");
  console.log("PASS  mask + timers");

  const empty = await userFromTwoFactorGrant("");
  assert(empty === null, "empty grant is null (no throw)");
  const blank = await userFromTwoFactorGrant("   ");
  assert(blank === null, "whitespace grant is null (no throw)");
  console.log("PASS  grant authorize empty input → null");

  console.log("\nverify-two-factor OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
