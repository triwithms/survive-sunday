import { CLAIM_ERRORS } from "@/lib/claim-seat";
import { normalizeAuthPassword } from "@/lib/auth-credentials";
import { submitCredentialsLogin } from "@/lib/client-auth";
import { joinRequestBody, postJoin } from "./join-post";

export async function runJoinSubmit(args: {
  canSubmit: boolean;
  sessionEmail: string;
  email: string;
  password: string;
  newPlayer: boolean;
  inviteCode: string;
  nickname: string;
  realName: string;
  membershipId: string;
  tokenParam: string;
  setErr: (value: string) => void;
}): Promise<boolean> {
  if (!args.canSubmit) {
    args.setErr(CLAIM_ERRORS.alreadyClaimed);
    return false;
  }
  const claimEmail = args.sessionEmail || args.email;
  const claimPassword = normalizeAuthPassword(args.password);
  const result = await postJoin(
    joinRequestBody({
      newPlayer: args.newPlayer,
      inviteCode: args.inviteCode,
      email: claimEmail,
      password: claimPassword,
      nickname: args.nickname,
      realName: args.realName,
      membershipId: args.membershipId,
      tokenParam: args.tokenParam,
    })
  );
  if (!result.ok) {
    args.setErr(result.error || "Join failed");
    return false;
  }
  submitCredentialsLogin(claimEmail, claimPassword || args.password, "/pick");
  return true;
}
