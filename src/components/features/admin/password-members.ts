export type SetPasswordMember = {
  id: string;
  nickname: string;
  realName: string | null;
  claimed: boolean;
  emailMasked: string | null;
};

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
