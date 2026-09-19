import { isDemoEmail, normalizeEmail } from "./otp";
import { lookupResetUser } from "./password-reset-lookup";
import { sendResetCode } from "./password-reset-send";
import type { ResetStatus } from "./password-reset-types";

export type { ResetStatus } from "./password-reset-types";
export { resetPasswordWithCode } from "./password-reset-complete";
export { resetChannels } from "./password-reset-channel";

const sendLocks = new Map<string, Promise<unknown>>();

async function withSendLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = sendLocks.get(key) ?? Promise.resolve();
  let release: () => void = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  sendLocks.set(key, prev.then(() => current));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (sendLocks.get(key) === current) sendLocks.delete(key);
  }
}

export async function requestPasswordReset(
  emailRaw: string
): Promise<
  | { ok: true; demo?: boolean; message?: string; status?: ResetStatus }
  | { ok: false; error: string; status?: ResetStatus }
> {
  try {
    const email = normalizeEmail(emailRaw);
    if (!email || !email.includes("@")) {
      return { ok: false, error: "Enter the email you use to sign in." };
    }
    if (isDemoEmail(email)) {
      return {
        ok: true,
        demo: true,
        message:
          "Demo seats always use password demo1234. Use the picker on the home page — no reset needed.",
      };
    }

    const user = await lookupResetUser(emailRaw);
    if (!user) {
      return {
        ok: false,
        error:
          "We don’t have that email. Check the spelling, or ask the administrator.",
      };
    }

    return withSendLock(user.id, () => sendResetCode(user));
  } catch (error) {
    console.error("[password-reset] request failed", error);
    return { ok: false, error: "Could not send a code. Try again." };
  }
}
