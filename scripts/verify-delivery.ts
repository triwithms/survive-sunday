/**
 * Resend / OTP delivery helpers: never silently fall back to the sandbox From,
 * and map Resend failures into plain English.
 *
 *   npx tsx scripts/verify-delivery.ts
 */
import {
  RESEND_TEST_FROM,
  canStubDelivery,
  configuredFromEmail,
  emailProviderReady,
  explainResendFailure,
  extractEmailAddress,
  fromEmail,
  isResendTestingFrom,
  missingEmailConfigError,
  parseResendErrorBody,
  readEmailDeliveryStatus,
  resendApiKey,
  sendResendMessage,
  trimEnvValue,
} from "../src/lib/delivery";
import { deliverOtp } from "../src/lib/otp-delivery";
import { OTP_PURPOSE_PASSWORD_RESET, OTP_PURPOSE_SIGN_IN } from "../src/lib/otp";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const saved: Record<string, string | undefined> = {};

function stash(keys: string[]) {
  for (const key of keys) saved[key] = process.env[key];
}

function restore() {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function setEnv(next: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

async function main() {
  stash([
    "NODE_ENV",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER",
  ]);

  try {
    assert(trimEnvValue('  "re_abc"  ') === "re_abc", "trim quoted env");
    assert(
      extractEmailAddress("Survive Sunday <noreply@pool.example>") ===
        "noreply@pool.example",
      "extract angled"
    );
    assert(
      extractEmailAddress("noreply@pool.example") === "noreply@pool.example",
      "extract bare"
    );
    assert(isResendTestingFrom(RESEND_TEST_FROM), "test from");
    assert(
      isResendTestingFrom("Survive Sunday <onboarding@resend.dev>"),
      "test from display"
    );
    assert(!isResendTestingFrom("Survive Sunday <noreply@friends.ca>"), "real from");
    console.log("PASS  from-address helpers");

    setEnv({
      NODE_ENV: "production",
      RESEND_API_KEY: undefined,
      RESEND_FROM_EMAIL: undefined,
    });
    assert(!canStubDelivery(), "production does not stub");
    assert(!emailProviderReady(), "missing keys not ready");
    assert(!resendApiKey(), "no key");
    assert(!configuredFromEmail(), "no from");
    assert(fromEmail() === "", "production has no silent onboarding fallback");
    const missing = missingEmailConfigError();
    assert(/RESEND_API_KEY/.test(missing) && /RESEND_FROM_EMAIL/.test(missing), missing);

    const stubbed = await sendResendMessage({
      to: "mike@example.com",
      subject: "code",
      text: "1",
      html: "<p>1</p>",
    });
    assert(!stubbed.ok, "production missing keys must fail");
    assert(/RESEND_API_KEY/.test(stubbed.error), stubbed.error);
    console.log("PASS  production missing keys fail out loud");

    setEnv({
      NODE_ENV: "production",
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "Survive Sunday <onboarding@resend.dev>",
    });
    assert(!emailProviderReady(), "onboarding from not ready in production");
    const testFrom = await sendResendMessage({
      to: "mike@example.com",
      subject: "code",
      text: "1",
      html: "<p>1</p>",
    });
    assert(!testFrom.ok, "test from must not send in production");
    assert(/onboarding@resend\.dev/.test(testFrom.error), testFrom.error);
    console.log("PASS  production rejects onboarding@resend.dev");

    setEnv({
      NODE_ENV: "production",
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: undefined,
    });
    const noFrom = await sendResendMessage({
      to: "mike@example.com",
      subject: "code",
      text: "1",
      html: "<p>1</p>",
    });
    assert(!noFrom.ok && /RESEND_FROM_EMAIL/.test(noFrom.error), noFrom.error);
    console.log("PASS  production missing FROM fails (no silent fallback)");

    setEnv({
      NODE_ENV: "production",
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "Survive Sunday <noreply@friends.example>",
    });
    assert(emailProviderReady(), "verified-looking from is ready");
    const status = readEmailDeliveryStatus();
    assert(status.ready && status.hasApiKey && status.hasFromEmail, "status ready");
    assert(status.fromAddressMasked?.includes("@friends.example"), status.fromAddressMasked);
    assert(!status.fromIsTestAddress, "not test");
    console.log("PASS  delivery status for a real From");

    const ownInbox = explainResendFailure(
      403,
      JSON.stringify({
        message: "You can only send testing emails to your own email address.",
      })
    );
    assert(/test mode/.test(ownInbox) && /friends/.test(ownInbox), ownInbox);

    const badKey = explainResendFailure(
      401,
      JSON.stringify({ message: "API key is invalid" })
    );
    assert(/API key/.test(badKey) && /Vercel/.test(badKey), badKey);

    const unverified = explainResendFailure(
      422,
      JSON.stringify({ message: "The domain is not verified." })
    );
    assert(/not verified/.test(unverified) && /Domains/.test(unverified), unverified);

    assert(
      parseResendErrorBody('{"message":"nope"}') === "nope",
      "parse json message"
    );
    console.log("PASS  Resend errors are plain English");

    setEnv({
      NODE_ENV: "development",
      RESEND_API_KEY: undefined,
      RESEND_FROM_EMAIL: undefined,
    });
    const dev = await deliverOtp(
      "email",
      "mike@example.com",
      "123456",
      OTP_PURPOSE_PASSWORD_RESET
    );
    assert(dev.ok && dev.stubbed, "dev stubs when keys missing");
    const signIn = await deliverOtp(
      "email",
      "mike@example.com",
      "654321",
      OTP_PURPOSE_SIGN_IN
    );
    assert(signIn.ok && signIn.stubbed, "sign-in path also calls deliverOtp");
    console.log("PASS  forgot + sign-in code paths call deliverOtp");
  } finally {
    restore();
  }

  console.log("\nverify-delivery OK");
}

main().catch((error) => {
  restore();
  console.error(error);
  process.exit(1);
});
