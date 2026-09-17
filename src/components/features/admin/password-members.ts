import { PUBLIC_APP_ORIGIN } from "@/lib/invite-link";

export type SetPasswordMember = {
  id: string;
  nickname: string;
  realName: string | null;
  claimed: boolean;
  email: string | null;
  emailMasked: string | null;
};

export type PasswordKind = "temporary" | "permanent";

export const LOGIN_SHARE_URL = `${PUBLIC_APP_ORIGIN}/login`;

export function suggestTempPassword(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const n = ((bytes[0]! << 8) + bytes[1]!) % 9000 + 1000;
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[bytes[2]! % letters.length];
  const b = letters[bytes[3]! % letters.length];
  return `Sunday-${n}${a}${b}`;
}

export function passwordMemberLabel(m: SetPasswordMember): string {
  const real = (m.realName ?? "").trim();
  const who =
    real && real.toLowerCase() !== m.nickname.toLowerCase()
      ? `${m.nickname} (${real})`
      : m.nickname;
  return m.claimed
    ? `${who} — Joined ${m.emailMasked ?? ""}`
    : `${who} — not Joined yet`;
}

export function memberPasswordShareText(opts: {
  email: string;
  password: string;
  kind: PasswordKind;
}): string {
  const keep =
    opts.kind === "permanent"
      ? "Keep this password. You can still change it later with Forgot password."
      : "You can change this later with Forgot password if you want.";
  return [
    "Survive Sunday sign-in",
    `Email: ${opts.email}`,
    `Password: ${opts.password}`,
    LOGIN_SHARE_URL,
    "",
    "Open Sign in → Use password instead if the email code is in spam.",
    keep,
  ].join("\n");
}
