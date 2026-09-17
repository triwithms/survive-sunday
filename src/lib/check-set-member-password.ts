import { isSeatClaimed } from "./claim-seat";
import { OTP } from "./otp";
import { nicknamesMatch } from "./pool-rules";
import { isPlayerSeat } from "./roles";

export const ADMIN_SET_PASSWORD_AUDIT = "member_temp_password_set";
export const TEMP_PASSWORD_MIN = OTP.minPasswordLength;
export const TEMP_PASSWORD_MAX = 72;

export type SetMemberPasswordMember = {
  id: string;
  nickname: string;
  role: string;
  email: string | null;
};

export type SetMemberPasswordInput = {
  membershipId: string;
  confirmNickname: string;
  password: string;
  member: SetMemberPasswordMember | null;
};

export type SetMemberPasswordCheck =
  | { ok: true; nickname: string; email: string }
  | { ok: false; error: string };

/**
 * Commissioner may set a password only for a claimed player seat
 * (real email, not a practice @survivesunday.demo address).
 */
export function checkSetMemberPassword(
  input: SetMemberPasswordInput
): SetMemberPasswordCheck {
  const membershipId = input.membershipId.trim();
  const confirmNickname = input.confirmNickname.trim();
  const password = input.password;
  if (!membershipId) {
    return { ok: false, error: "Pick the person who needs a password." };
  }
  if (!input.member || input.member.id !== membershipId) {
    return { ok: false, error: "We couldn’t find that person in this pool." };
  }
  if (!isPlayerSeat(input.member)) {
    return {
      ok: false,
      error: "That seat is the commissioner spectator, not a player.",
    };
  }
  if (!isSeatClaimed(input.member.email)) {
    return {
      ok: false,
      error: `${input.member.nickname} has not Joined yet. Send them their personal Join link instead of a password.`,
    };
  }
  if (!nicknamesMatch(input.member.nickname, confirmNickname)) {
    return { ok: false, error: `Type ${input.member.nickname} again to confirm.` };
  }
  if (typeof password !== "string" || password.length < TEMP_PASSWORD_MIN) {
    return {
      ok: false,
      error: `Password must be at least ${TEMP_PASSWORD_MIN} characters.`,
    };
  }
  if (password.length > TEMP_PASSWORD_MAX) {
    return {
      ok: false,
      error: `Password must be ${TEMP_PASSWORD_MAX} characters or fewer.`,
    };
  }
  if (!password.trim()) {
    return { ok: false, error: "Password cannot be only spaces." };
  }
  return {
    ok: true,
    nickname: input.member.nickname,
    email: input.member.email!.trim(),
  };
}
