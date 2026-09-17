import { OTP_PURPOSE_PASSWORD_RESET } from "./otp";
import { deliverOtp } from "./otp-delivery";
import type { ResetUser } from "./password-reset-types";

export async function deliverResetCode(
  user: ResetUser,
  code: string
): Promise<
  | { ok: true; smsSent: boolean; stubbed: boolean }
  | { ok: false; error: string }
> {
  const purpose = OTP_PURPOSE_PASSWORD_RESET;
  const emailed = await deliverOtp("email", user.email, code, purpose);
  if (!emailed.ok) return { ok: false, error: emailed.error };

  let smsSent = false;
  if (user.phoneE164) {
    const texted = await deliverOtp("sms", user.phoneE164, code, purpose);
    smsSent = texted.ok;
  }
  return { ok: true, smsSent, stubbed: emailed.stubbed };
}
