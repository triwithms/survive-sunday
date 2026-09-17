import { challengeFrom, postForgot, postReset } from "./forgot-api";
import type { ChallengeView } from "./forgot-types";

export type SendForgotResult =
  | { kind: "demo"; message: string }
  | { kind: "error"; error: string; status: ChallengeView | null }
  | { kind: "sent"; status: ChallengeView | null };

export async function sendForgotCode(
  email: string
): Promise<SendForgotResult> {
  const { res, data } = await postForgot(email);
  if (data?.demo === true) {
    return {
      kind: "demo",
      message:
        (typeof data.message === "string" && data.message) ||
        "Demo seats always use password demo1234.",
    };
  }
  const status = challengeFrom(data);
  if (!res.ok) {
    return {
      kind: "error",
      error:
        (typeof data?.error === "string" && data.error) ||
        "Could not send a code. Try again.",
      status,
    };
  }
  return { kind: "sent", status };
}

export async function finishReset(
  email: string,
  code: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { res, data } = await postReset(email, code, password);
  if (!res.ok) {
    return {
      ok: false,
      error:
        (typeof data?.error === "string" && data.error) ||
        "Could not reset that password.",
    };
  }
  return { ok: true };
}
