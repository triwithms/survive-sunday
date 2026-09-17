import type { OtpChannel } from "@/lib/otp";
import type { ChallengeView } from "./forgot-types";
import { readJson } from "./otp-json";

export async function postForgot(email: string, channel?: OtpChannel) {
  const res = await fetch("/api/password/forgot", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, ...(channel ? { channel } : {}) }),
  });
  return { res, data: await readJson(res) };
}

export async function postReset(
  email: string,
  code: string,
  password: string
) {
  const res = await fetch("/api/password/reset", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, password }),
  });
  return { res, data: await readJson(res) };
}

export function challengeFrom(
  data: Record<string, unknown> | null
): ChallengeView | null {
  const status = (data?.channel ? data : data?.status) as
    | ChallengeView
    | undefined;
  if (status?.channel && status.destinationMasked) return status;
  return null;
}
