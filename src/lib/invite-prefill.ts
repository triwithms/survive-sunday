/** Safe fields the Sign in page may show from an invite token. */

export const INVITE_EXPIRED_MESSAGE =
  "Invite link expired — ask your Administrator for a new one.";

export type InvitePrefill = {
  email: string;
  nickname: string;
};

export function safeInvitePrefill(row: {
  email?: string | null;
  nickname?: string | null;
}): InvitePrefill {
  return {
    email: (row.email ?? "").trim(),
    nickname: (row.nickname ?? "").trim(),
  };
}
